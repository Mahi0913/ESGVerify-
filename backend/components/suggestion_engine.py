"""
╔══════════════════════════════════════════════════════════════════════╗
║  SUGGESTION ENGINE — ESGVerify                                     ║
║  AI-powered improvement suggestions with buyer-specific priority    ║
╚══════════════════════════════════════════════════════════════════════╝

HOW PRIORITY IS DETERMINED:
────────────────────────────
The priority of each suggestion is NOT arbitrary. It's computed using
a 3-factor weighted score:

    Priority Score = (Buyer Weight × 0.5) + (Gap Severity × 0.3) + (Ease × 0.2)

    1. Buyer Weight (50%): What does THIS SPECIFIC buyer care about most?
       - AI analyzes buyer requirements from web search
       - e.g., H&M prioritizes carbon + water, Tata prioritizes safety + compliance
       - This is fetched via the AI API call to assess buyer priorities

    2. Gap Severity (30%): How bad is the MSME's current gap?
       - Score < 30 → critical gap (weight 1.0)
       - Score 30-50 → significant gap (weight 0.7)
       - Score 50-70 → moderate gap (weight 0.4)
       
    3. Ease of Implementation (20%): Quick wins get slight boost
       - Easy changes (training, documentation) → weight 0.8
       - Medium changes (equipment, processes) → weight 0.5
       - Hard changes (infrastructure, major capex) → weight 0.3
"""

from utils.ai_client import ai_json


def generate_suggestions(kpis, gap_analysis, company_data, buyer_name, govt_schemes_results):
    """
    Generate prioritized improvement suggestions using AI.

    The AI prompt is carefully crafted to:
    1. Consider buyer-specific priorities (not generic ESG advice)
    2. Assign priorities using the 3-factor model above
    3. Give realistic Indian cost estimates
    4. Create an action plan ordered by priority (not fixed 12-week)
    5. Only suggest schemes the MSME actually qualifies for
    """
    kpi_text = "\n".join([
        f"  KPI {k['kpi_number']}: {k['kpi_name']} = {k['display_value']} {k['unit']} "
        f"(Score: {k['score']}/100, Status: {k['status']})"
        for k in kpis
    ])

    gap_text = "\n".join([
        f"  {g['kpi_name']}: {g['status']} — {g['gap_detail']}"
        for g in (gap_analysis or {}).get("gaps", [])
    ]) or "No gap data"

    schemes_text = "\n".join([
        f"  - {s['title']}: {s['snippet']}"
        for s in (govt_schemes_results or [])[:5]
    ]) or "No scheme data"

    prompt = f"""You are an ESG improvement consultant for Indian MSMEs. Generate a PRIORITIZED action plan.

COMPANY PROFILE:
- Industry: {company_data.get('industry', 'Manufacturing')}
- State: {company_data.get('state', 'India')}
- Workers: {company_data.get('workers', 'N/A')}
- Target Buyer: {buyer_name}

CURRENT KPI SCORES:
{kpi_text}

GAP ANALYSIS vs {buyer_name}:
{gap_text}

AVAILABLE GOVERNMENT SCHEMES:
{schemes_text}

PRIORITY LOGIC — Use this 3-factor model to assign priority:
1. BUYER WEIGHT (50%): What does {buyer_name} specifically care about most? 
   Think about what {buyer_name}'s industry demands from suppliers.
2. GAP SEVERITY (30%): KPIs with score < 30 are critical, 30-50 are significant, 50-70 are moderate.
3. EASE OF IMPLEMENTATION (20%): Quick wins (training, documentation) get a slight priority boost.

For each suggestion, explain WHY it has that priority using this logic.

Generate ONLY JSON (no markdown, no backticks):
{{
  "suggestions": [
    {{
      "priority": 1,
      "title": "Short action title",
      "description": "What to do and why it matters for {buyer_name} specifically",
      "priority_reasoning": "Why this is priority N: [buyer cares about X] + [current gap is Y] + [ease: Z]",
      "kpi_affected": "Which KPI this improves",
      "estimated_cost": "Rs X - Rs Y (realistic for Indian MSME)",
      "estimated_annual_saving": "Rs X - Rs Y",
      "payback_period": "X months",
      "difficulty": "easy/medium/hard",
      "buyer_importance": "critical/important/nice-to-have"
    }}
  ],
  "action_plan": {{
    "immediate": ["Actions for first 2 weeks — quick wins and documentation"],
    "short_term": ["Actions for weeks 3-6 — process changes and compliance fixes"],
    "medium_term": ["Actions for weeks 7-12 — equipment and infrastructure"],
    "ongoing": ["Continuous improvement actions beyond 12 weeks"]
  }},
  "schemes": [
    {{
      "name": "Scheme name",
      "benefit": "What you get (subsidy amount, loan rate etc.)",
      "eligibility": "Why this MSME qualifies based on their SPECIFIC gaps",
      "how_to_apply": "Step-by-step application process"
    }}
  ]
}}

RULES:
- Generate 5-7 suggestions ordered by priority (highest first)
- All costs in Rs (Indian Rupees) — use realistic estimates for Indian MSMEs
- Action plan phases should be ordered by priority, not arbitrary timeline
- Government schemes: ONLY include schemes the MSME actually qualifies for based on their gaps. If all scores are good, return empty schemes array.
- No emoji. No generic advice. Be specific to {company_data.get('industry', 'this')} sector.
- Each suggestion must reference a specific KPI that needs improvement."""

    result = ai_json(prompt, max_tokens=3000)

    if result and "suggestions" in result:
        # Rename "roadmap" to "action_plan" for backward compatibility
        if "roadmap" in result and "action_plan" not in result:
            result["action_plan"] = result.pop("roadmap")
        # Convert old week-based format to phase-based if needed
        if "action_plan" in result:
            ap = result["action_plan"]
            if any(k.startswith("week_") for k in ap.keys()):
                result["action_plan"] = _convert_week_to_phase(ap)
        return result

    return _fallback(kpis, buyer_name)


def _convert_week_to_phase(roadmap):
    """Convert old week_1_2, week_3_4 format to phase format."""
    phases = {"immediate": [], "short_term": [],
              "medium_term": [], "ongoing": []}
    keys = sorted(roadmap.keys())
    for i, key in enumerate(keys):
        if i < 1:
            phases["immediate"].extend(roadmap[key])
        elif i < 3:
            phases["short_term"].extend(roadmap[key])
        elif i < 5:
            phases["medium_term"].extend(roadmap[key])
        else:
            phases["ongoing"].extend(roadmap[key])
    return phases


def _fallback(kpis, buyer_name):
    """
    Fallback suggestions when AI is unavailable.
    Uses the same 3-factor priority logic but with hardcoded values.
    """
    sugs = []
    p = 1
    for k in kpis:
        if k["score"] < 50:
            if "GHG" in k["kpi_name"] or "Energy" in k["kpi_name"]:
                sugs.append({
                    "priority": p, "title": "Install Rooftop Solar (5-10 kW)",
                    "description": "Reduces grid dependency and Scope 2 emissions. Most buyers now track renewable energy percentage.",
                    "priority_reasoning": f"High priority: {buyer_name} tracks GHG metrics + current score is {k['score']}/100 (critical gap) + medium difficulty",
                    "kpi_affected": k["kpi_name"],
                    "estimated_cost": "Rs 2.5L - Rs 5.5L",
                    "estimated_annual_saving": "Rs 60K - Rs 1.5L",
                    "payback_period": "36-48 months",
                    "difficulty": "medium", "buyer_importance": "critical",
                })
            elif "Water" in k["kpi_name"]:
                sugs.append({
                    "priority": p, "title": "Install Basic ETP for Water Recycling",
                    "description": "Recycle 30-50% of process water. Reduces water footprint and meets buyer recycling targets.",
                    "priority_reasoning": f"Priority {p}: Water recycling is a key buyer requirement + score {k['score']}/100 + medium difficulty",
                    "kpi_affected": k["kpi_name"],
                    "estimated_cost": "Rs 3L - Rs 8L",
                    "estimated_annual_saving": "Rs 40K - Rs 1L",
                    "payback_period": "24-36 months",
                    "difficulty": "medium", "buyer_importance": "important",
                })
            elif "Safety" in k["kpi_name"]:
                sugs.append({
                    "priority": p, "title": "Monthly Safety Training Program",
                    "description": "Regular training reduces incidents by 40-60%. Legally required under Factories Act.",
                    "priority_reasoning": f"Priority {p}: Worker safety is non-negotiable for all buyers + score {k['score']}/100 + easy to implement",
                    "kpi_affected": k["kpi_name"],
                    "estimated_cost": "Rs 20K - Rs 50K/year",
                    "estimated_annual_saving": "Rs 1L - Rs 5L in avoided claims",
                    "payback_period": "3-6 months",
                    "difficulty": "easy", "buyer_importance": "critical",
                })
            elif "Wage" in k["kpi_name"] or "ESI" in k["kpi_name"]:
                sugs.append({
                    "priority": p, "title": "Ensure 100% ESI/PF Compliance",
                    "description": "Register all workers for ESI and PF. This is legally mandatory and a deal-breaker for buyer audits.",
                    "priority_reasoning": f"HIGHEST priority: Legal mandate + buyer audit requirement + score {k['score']}/100 + easy implementation",
                    "kpi_affected": k["kpi_name"],
                    "estimated_cost": "~12% of wages (employer contribution)",
                    "estimated_annual_saving": "Avoids Rs 50K+ penalties and contract loss",
                    "payback_period": "Immediate",
                    "difficulty": "easy", "buyer_importance": "critical",
                })
            elif "Gender" in k["kpi_name"]:
                sugs.append({
                    "priority": p, "title": "Women Workforce Recruitment Drive",
                    "description": "Current percentage is below most buyer thresholds. Consider targeted hiring and creche facility if needed.",
                    "priority_reasoning": f"Priority {p}: Buyer social criteria + score {k['score']}/100 + medium effort",
                    "kpi_affected": k["kpi_name"],
                    "estimated_cost": "Rs 1L - Rs 2L setup",
                    "estimated_annual_saving": "Meets buyer social criteria, avoids audit flags",
                    "payback_period": "6-12 months",
                    "difficulty": "medium", "buyer_importance": "important",
                })
            p += 1

    if not sugs:
        sugs.append({
            "priority": 1, "title": "Maintain Current Performance and Documentation",
            "description": "All metrics are healthy. Focus on maintaining documentation and audit readiness.",
            "priority_reasoning": "All KPIs are in good range — focus shifts to documentation and continuous improvement",
            "kpi_affected": "All",
            "estimated_cost": "Minimal",
            "estimated_annual_saving": "Maintain existing contracts",
            "payback_period": "Ongoing",
            "difficulty": "easy", "buyer_importance": "important",
        })

    return {
        "suggestions": sugs,
        "action_plan": {
            "immediate": [
                "Complete data audit and verify all inputs",
                "Identify workers without ESI/PF and begin registration",
            ],
            "short_term": [
                "Get energy audit quote from BEE-certified auditor",
                "Begin monthly safety training with documented attendance",
                "Replace conventional lighting with LED in production areas",
            ],
            "medium_term": [
                "Get quotes for rooftop solar installation (5-10 kW)",
                "Commission ETP/water recycling feasibility study",
                "Apply for ZED certification if eligible",
            ],
            "ongoing": [
                "Implement waste segregation with authorized recycler",
                "Document all environmental and safety processes",
                "Generate BRSR report with all 9 KPIs quarterly",
                "Submit compliance documentation to buyer procurement",
            ],
        },
        "schemes": [],
    }
