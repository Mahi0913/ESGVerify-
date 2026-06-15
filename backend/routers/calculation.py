"""
Calculation Router — KPI calculation, data verification, fuzzy scoring.
Also handles GSTIN/city validation and question generation.
Endpoints: POST /calculate-kpis, /verify-data, /fuzzy-scores, /explain-results,
           /validate-*, /generate-questions
"""

from fastapi import APIRouter

from components.calculator import calculate_all_kpis, get_overall_score
from components.fuzzy_scorer import (fuzzy_classify_kpi, fuzzy_overall_score,
                                     fuzzy_confidence_score, fuzzy_greenwash_risk)
from components.verifier import (validate_gstin, verify_gstin_state_match,
                                 validate_city_state, run_consistency_checks)
from components.question_engine import generate_dynamic_questions
from routers.deps import (KPIRequest, VerifyRequest, FuzzyRequest,
                          GSTINRequest, CityStateRequest, GSTINStateRequest,
                          QuestionRequest)

router = APIRouter(prefix="/api", tags=["Calculation & Verification"])


# ─── VALIDATION ───

@router.post("/validate-gstin")
async def api_validate_gstin(req: GSTINRequest):
    """Validate GSTIN format, pattern, and Luhn checksum."""
    return validate_gstin(req.gstin)


@router.post("/validate-city-state")
async def api_validate_city_state(req: CityStateRequest):
    """Check if city belongs to the declared state."""
    return validate_city_state(req.city, req.state)


@router.post("/verify-gstin-state")
async def api_verify_gstin_state(req: GSTINStateRequest):
    """Cross-check GSTIN state code against declared state."""
    return verify_gstin_state_match(req.gstin, req.state)


# ─── QUESTIONS ───

@router.post("/generate-questions")
async def api_generate_questions(req: QuestionRequest):
    """Generate 27 standard + AI bonus questions for the assessment."""
    questions = generate_dynamic_questions(
        req.industry, req.buyer_name, req.buyer_requirements_text)
    return {"questions": questions, "count": len(questions)}


# ─── KPI CALCULATION ───

@router.post("/calculate-kpis")
async def api_calculate_kpis(req: KPIRequest):
    """Calculate all 9 BRSR Core KPIs from raw data.
    Uses CEA v19 grid emission factor, IPCC 2006 fuel factors,
    BEE energy conversion, and state minimum wages.
    Returns KPIs with buyer-adaptive fuzzy classification.
    """
    kpis = calculate_all_kpis(req.data)
    buyer_name = req.data.get("buyer_name", "")
    overall = fuzzy_overall_score(
        kpis, buyer_name=buyer_name, company_data=req.data)
    # Only add fuzzy if calculator didn't already set it
    for k in kpis:
        if "fuzzy" not in k or not k["fuzzy"]:
            k["fuzzy"] = fuzzy_classify_kpi(k["score"])
    return {"kpis": kpis, "overall": overall}


# ─── DATA VERIFICATION ───

@router.post("/verify-data")
async def api_verify_data(req: VerifyRequest):
    """Run 17 cross-validation checks on submitted data.
    Checks: industry benchmarks, mass balance, wage compliance,
    electricity bill vs units, ESI/PF coverage, and more.
    """
    checks = run_consistency_checks(req.data)
    gstin = req.data.get("gstin", "")
    state = req.data.get("state", "")
    if gstin and state:
        gc = verify_gstin_state_match(gstin, state)
        checks = [{"title": "GSTIN Validation", "message": gc["message"],
                   "status": gc["status"], "category": "identity"}] + checks
    confidence = fuzzy_confidence_score(checks)
    return {"checks": checks, "confidence": confidence}


# ─── FUZZY SCORING ───

@router.post("/fuzzy-scores")
async def api_fuzzy_scores(req: FuzzyRequest):
    """Compute fuzzy confidence, greenwash risk (Mamdani FIS),
    and buyer-adaptive pillar-weighted ESG score.
    Applies greenwash-ESG coupling: high risk reduces ESG score.
    """
    confidence = fuzzy_confidence_score(req.checks)
    greenwash = fuzzy_greenwash_risk(req.checks, req.kpis, req.company_data)
    buyer_name = req.company_data.get("buyer_name", "")
    overall = fuzzy_overall_score(
        req.kpis, buyer_name=buyer_name, company_data=req.company_data)

    # Greenwash-ESG coupling: high greenwash risk reduces ESG score
    # Based on ISA 200 audit risk adjustment principle
    gw_risk = greenwash.get("risk_score", 0)
    raw_score = overall.get("score", 0)
    discount_factor = 0.25
    greenwash_discount = round(gw_risk * discount_factor, 1)
    adjusted_score = max(0, round(raw_score - greenwash_discount, 1))

    overall["raw_score"] = raw_score
    overall["greenwash_discount"] = greenwash_discount
    overall["score"] = adjusted_score

    return {"confidence": confidence, "greenwash": greenwash, "overall": overall}


@router.get("/fuzzy-classify/{score}")
async def api_fuzzy_classify(score: int):
    """Classify a single KPI score using Gaussian membership functions.
    Returns membership degrees for good/moderate/poor with explanation.
    """
    return fuzzy_classify_kpi(score)


# ─── AI-POWERED RESULTS EXPLANATION ───

@router.post("/explain-results")
async def explain_results(req: KPIRequest):
    """Generate AI-powered plain English summary of all 9 KPI scores.
    Highlights strengths, weaknesses, and one actionable next step.
    Falls back to template summary if AI is unavailable.
    """
    from utils.ai_client import ai_text

    kpis = calculate_all_kpis(req.data)
    overall = fuzzy_overall_score(kpis)

    kpi_summary = "\n".join([
        f"- {k['kpi_name']}: Score {k['score']}/100 ({k.get('score_tier', 'N/A')}). "
        f"{k.get('score_reasoning', '')}"
        for k in kpis
    ])

    prompt = f"""You are an ESG advisor for Indian MSMEs. A factory just completed their BRSR assessment.

Their 9 KPI scores:
{kpi_summary}

Write a 150-word summary in simple English that:
1. Highlights the 2-3 strongest areas (what they are doing well)
2. Identifies the 2-3 weakest areas (what needs immediate attention)
3. Gives ONE specific, actionable next step they should take this week

Use simple language a factory owner would understand. No jargon.
Mention specific numbers from their scores.
All costs in Indian Rupees.
Do not use bullet points — write in flowing paragraphs."""

    summary = ai_text(prompt, max_tokens=400)

    if not summary:
        weak = [k for k in kpis if k["score"] < 50]
        strong = [k for k in kpis if k["score"] >= 70]
        summary = (
            f"Your strongest areas are "
            f"{', '.join(k['kpi_name'] for k in strong[:3]) if strong else 'being assessed'}. "
            f"{'Areas needing attention: ' + ', '.join(k['kpi_name'] for k in weak[:3]) + '.' if weak else 'All areas are performing well.'} "
            f"Focus on improving your lowest-scoring KPI first."
        )

    return {
        "summary": summary,
        "kpis": kpis,
        "overall": overall,
        "ai_generated": bool(summary),
    }
