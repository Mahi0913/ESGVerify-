"""
╔══════════════════════════════════════════════════════════════════════╗
║  GAP ANALYZER — ESGVerify                                          ║
║  Compares MSME's KPIs against buyer-specific requirements          ║
╚══════════════════════════════════════════════════════════════════════╝

WHAT THIS DOES:
    1. analyze_gaps() — Compares your KPIs vs what the buyer requires
       - Shows "MSME Name" vs "Buyer Name" in the gap table
       - Checks if MSME industry is even relevant for this buyer
       - Orders gaps by what THIS buyer cares about most
    
    2. analyze_buyer_expansion() — What EXTRA do you need for a new buyer?
       - Supports custom buyer name (not just dropdown)
       - Explains if MSME sector is relevant for the new buyer
"""

from utils.ai_client import ai_json


def analyze_gaps(kpis, buyer_name, buyer_search_results, company_data=None):
    """
    AI-powered gap analysis: MSME vs buyer requirements.

    Parameters:
        kpis: list of 9 KPI dicts from calculator
        buyer_name: str — target buyer
        buyer_search_results: list — web search results about buyer
        company_data: dict — MSME details (name, industry, state etc.)
    """
    company_name = (company_data or {}).get("company_name", "Your MSME")
    industry = (company_data or {}).get("industry", "Manufacturing")

    kpi_text = "\n".join([
        f"  KPI {k['kpi_number']}: {k['kpi_name']} = {k['display_value']} {k['unit']} "
        f"(Score: {k['score']}/100, Status: {k['status']})"
        for k in kpis
    ])

    search_text = "\n".join([
        f"  - {r['title']}: {r['snippet']}"
        for r in buyer_search_results[:5]
    ])

    prompt = f"""You are an ESG gap analyst comparing an MSME against a specific buyer's requirements.

MSME: "{company_name}" — {industry} sector
TARGET BUYER: "{buyer_name}"

MSME's Current KPI Scores:
{kpi_text}

Buyer's Requirements (from web search):
{search_text}

INSTRUCTIONS:
1. INDUSTRY RELEVANCE: First assess if "{industry}" is a relevant supplier sector for "{buyer_name}". 
   If NOT relevant (e.g., IT company trying to supply garment brand), include this in your summary.
   
2. For EACH of the 9 KPIs, determine: met / borderline / gap
   - "met" = MSME meets or exceeds what {buyer_name} requires
   - "borderline" = close but needs improvement
   - "gap" = significant shortfall

3. ORDER the gaps by what {buyer_name} cares about MOST — different buyers have different priorities.
   Think about what {buyer_name}'s industry and sustainability commitments emphasize.

4. In buyer_requirement field, be SPECIFIC about what {buyer_name} expects (not generic "good performance")

Respond ONLY in JSON:
{{
  "readiness_score": 65,
  "summary": "2-3 sentences about {company_name}'s readiness to supply to {buyer_name}. If the industry is not relevant for this buyer, mention it clearly here. Include the MSME name and buyer name.",
  "industry_relevant": true,
  "industry_note": "Brief note on why {industry} is/isn't relevant for {buyer_name}. If irrelevant, suggest what sectors ARE relevant.",
  "buyer_priorities": [
    "Priority 1 specific to {buyer_name} (e.g., 'Carbon neutrality by 2030' for Apple)",
    "Priority 2",
    "Priority 3"
  ],
  "gaps": [
    {{
      "kpi_name": "KPI Name",
      "current_value": "{company_name}'s current value with unit",
      "buyer_requirement": "What {buyer_name} specifically expects (with numbers if available)",
      "status": "met/borderline/gap",
      "gap_detail": "Specific explanation of the gap and what needs to change",
      "priority": "high/medium/low"
    }}
  ]
}}"""

    result = ai_json(prompt, max_tokens=2500)
    if result and "gaps" in result:
        return result
    return _fallback(kpis, buyer_name, company_name)


def _fallback(kpis, buyer_name, company_name="Your MSME"):
    """Fallback when AI is unavailable."""
    gaps = []
    for k in kpis:
        s = "met" if k["score"] >= 70 else "borderline" if k["score"] >= 50 else "gap"
        gaps.append({
            "kpi_name": k["kpi_name"],
            "current_value": f"{k['display_value']} {k['unit']}",
            "buyer_requirement": "BRSR Core minimum standard",
            "status": s,
            "gap_detail": f"{company_name}'s score is {k['score']}/100 — {'meets' if s == 'met' else 'below'} {buyer_name}'s expected standard",
            "priority": "high" if k["score"] < 50 else ("medium" if k["score"] < 70 else "low"),
        })

    sc = round(sum(k["score"] for k in kpis) / len(kpis)) if kpis else 0
    return {
        "readiness_score": sc,
        "summary": f"{company_name} has an overall readiness score of {sc}/100 for {buyer_name}. {'Immediate action needed on critical gaps.' if sc < 50 else 'Some improvements needed to fully meet requirements.' if sc < 70 else 'Good standing with room for improvement.'}",
        "industry_relevant": True,
        "industry_note": "Industry relevance could not be verified without AI. Please confirm with buyer procurement team.",
        "buyer_priorities": ["GHG Emissions Reporting", "Worker Safety Compliance", "Waste Management Traceability"],
        "gaps": gaps,
    }


def analyze_buyer_expansion(current_gaps, new_buyer, new_search, kpis, company_data=None):
    """
    Analyze what ADDITIONAL improvements are needed to supply to a new buyer.

    This is called when the user selects a second buyer in the "Buyer Expansion" section.
    Supports both dropdown selection and typed custom buyer name.

    Parameters:
        current_gaps: dict — gap analysis from current buyer
        new_buyer: str — new buyer name (from dropdown or typed)
        new_search: list — web search results for new buyer
        kpis: list — current KPI scores
        company_data: dict — MSME details
    """
    company_name = (company_data or {}).get("company_name", "Your MSME")
    industry = (company_data or {}).get("industry", "Manufacturing")

    kpi_text = "\n".join([
        f"  {k['kpi_name']}: {k['display_value']} (Score: {k['score']})"
        for k in kpis
    ])
    search_text = "\n".join([
        f"  - {r['title']}: {r['snippet']}"
        for r in new_search[:5]
    ])

    prompt = f"""{company_name} ({industry} sector) wants to expand to supply "{new_buyer}".

Current KPIs:
{kpi_text}

{new_buyer}'s requirements (from web search):
{search_text}

IMPORTANT: First check if {industry} is a relevant supplier sector for {new_buyer}.
If NOT relevant, explain why and suggest what sectors {new_buyer} typically sources from.
If relevant, what ADDITIONAL improvements are needed beyond current performance?

All costs in Rs (Indian Rupees). No emoji. JSON only:
{{
  "expansion_feasibility": "easy/moderate/difficult/not_applicable",
  "industry_relevant": true,
  "industry_note": "Is {industry} a typical supplier to {new_buyer}? Explain briefly.",
  "additional_gaps": [
    {{
      "area": "What to improve",
      "current": "{company_name}'s current level",
      "needed": "What {new_buyer} needs",
      "effort": "How to close the gap",
      "estimated_cost_inr": "Rs X",
      "timeline_weeks": 12
    }}
  ],
  "total_estimated_cost": "Rs X Lakhs",
  "total_timeline": "X weeks",
  "recommendation": "1-2 sentences with specific advice for {company_name}"
}}"""

    result = ai_json(prompt, max_tokens=2000)
    if result:
        return result

    return {
        "expansion_feasibility": "moderate",
        "industry_relevant": True,
        "industry_note": f"Relevance of {industry} to {new_buyer} could not be verified. Check with buyer directly.",
        "additional_gaps": [],
        "total_estimated_cost": "Requires detailed assessment",
        "total_timeline": "12-24 weeks",
        "recommendation": f"{company_name} should contact {new_buyer}'s procurement team to understand specific supplier requirements for {industry} sector.",
    }
