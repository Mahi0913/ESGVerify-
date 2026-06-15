"""
╔══════════════════════════════════════════════════════════════════════╗
║  WEB SEARCH MODULE — ESGVerify                                     ║
║  Live web search for buyer ESG requirements + AI summarization     ║
╚══════════════════════════════════════════════════════════════════════╝

HOW IT WORKS:
    1. search_buyer_requirements() — Serper API to find buyer ESG docs
    2. summarize_buyer_requirements() — AI processes search results into:
       - Requirements summary (what the buyer specifically needs)
       - Relevance to YOUR MSME (is your industry even relevant?)
       - Key points to note (specific thresholds you must meet)
    3. search_government_schemes() — finds applicable subsidies
"""

import os
import json
import requests
from dotenv import load_dotenv
load_dotenv()

SERPER_API_KEY = os.getenv("SERPER_API_KEY")


def search_buyer_requirements(buyer_name, industry=None):
    """
    Search the web for the buyer's ESG/sustainability requirements.

    Uses Serper API (Google Search API) to find:
    - Supplier code of conduct
    - Sustainability reports
    - ESG requirements for suppliers

    Returns a list of search results with title, snippet, and link.
    Falls back to hardcoded data if API is unavailable.
    """
    if not SERPER_API_KEY or "paste" in (SERPER_API_KEY or ""):
        return _fallback(buyer_name)

    # Two targeted search queries for better coverage
    queries = [
        f"{buyer_name} supplier ESG requirements BRSR 2024 2025",
        f"{buyer_name} sustainability report supplier code of conduct",
    ]
    if industry:
        queries.append(
            f"{buyer_name} {industry} supplier environmental standards")

    results = []
    for q in queries[:2]:
        try:
            resp = requests.post(
                "https://google.serper.dev/search",
                headers={"X-API-KEY": SERPER_API_KEY,
                         "Content-Type": "application/json"},
                json={"q": q, "num": 5, "gl": "in"},
                timeout=10,
            )
            if resp.status_code == 200:
                for r in resp.json().get("organic", []):
                    results.append({
                        "title": r.get("title", ""),
                        "snippet": r.get("snippet", ""),
                        "link": r.get("link", ""),
                    })
        except Exception:
            continue

    # Deduplicate by link
    seen = set()
    unique = []
    for r in results:
        if r["link"] not in seen:
            seen.add(r["link"])
            unique.append(r)

    return unique[:8] if unique else _fallback(buyer_name)


def summarize_buyer_requirements(buyer_name, search_results, industry):
    """
    AI-powered summarization of buyer requirements with industry relevance check.

    IMPORTANT: This uses carefully crafted prompts to ensure:
    1. The AI checks if the MSME industry is compatible with the buyer
    2. Requirements are specific (not vague/generic)
    3. Key points include actual numbers/thresholds where possible
    4. Warnings are given if the buyer-MSME combination doesn't make sense
    """
    from utils.ai_client import ai_json

    search_text = "\n".join(
        [f"- {r['title']}: {r['snippet']}" for r in search_results[:6]]
    )

    # ─── CAREFULLY CRAFTED PROMPT ───
    # Each field has specific instructions to avoid vague/generic responses
    prompt = f"""You are an ESG compliance advisor for Indian MSMEs.

CONTEXT:
- Buyer: "{buyer_name}"
- MSME Industry Sector: "{industry}"
- Search results about this buyer's ESG requirements:
{search_text}

TASK: Analyze these search results and create a structured summary. Be SPECIFIC and PRACTICAL — no vague corporate language.

CRITICAL INSTRUCTION — INDUSTRY RELEVANCE CHECK:
First, determine if "{industry}" is a relevant supplier industry for "{buyer_name}".
Examples of MISMATCHES:
- IT company supplying to H&M (garment brand) → mismatch
- Food processing unit supplying to Apple (electronics) → mismatch
- Textile unit supplying to IKEA → relevant (IKEA sources textiles)
If there is a mismatch, you MUST say so clearly in requirements_summary and relevance_to_msme.

Respond ONLY in valid JSON (no markdown, no backticks):
{{
  "requirements_summary": "What does {buyer_name} specifically require from its suppliers based on the search results? Mention specific standards, certifications, or metrics they ask for. If the search results don't show specific requirements for {industry}, say so. If {industry} is not a typical supplier to {buyer_name}, explain the mismatch. Be SPECIFIC — not 'they care about sustainability' but 'they require Scope 1+2 GHG reporting with science-based targets'.",
  
  "relevance_to_msme": "How relevant are these requirements for a {industry} MSME specifically? What parts of their requirements apply to YOUR industry sector and what doesn't? If {industry} is NOT a typical supplier sector for {buyer_name}, clearly state: 'Your industry ({industry}) is not a typical supplier sector for {buyer_name}. {buyer_name} primarily sources from [relevant sectors]. However, if you are supplying [specific product/service], these requirements would still apply.' Be honest and practical.",
  
  "what_msme_should_do": "List 4-5 SPECIFIC actions this {industry} MSME should take to meet {buyer_name}'s requirements. Include concrete steps like 'Install electricity sub-meters on each production line' not vague ones like 'improve energy efficiency'. Mention specific Indian standards or certifications where relevant (BIS, BEE, ZED, ISO). Each action should be one clear sentence.",
  
  "supplier_compliance": "What audit or compliance process does {buyer_name} use for suppliers? Do they do site visits, require self-assessments, use third-party auditors? If search results mention SA8000, SMETA, Higg Index, EcoVadis, or any specific audit framework, mention it. If no specific audit info found, say 'Specific audit framework not identified in search results — recommend contacting {buyer_name} procurement team directly.'",
  
  "key_points_to_note": [
    "Your MSME must have [specific requirement with number if available]",
    "Minimum threshold: [specific metric like 'LTIFR below 2.0' or 'minimum 20% renewable energy']",
    "{buyer_name} specifically looks for [priority area] in supplier audits",
    "Deadline or timeline: [if mentioned in search results]",
    "Non-compliance consequence: [if mentioned — e.g., contract termination, remediation period]"
  ]
}}

RULES:
- All costs in Indian Rupees (Rs)
- Reference Indian regulations (Factories Act, EPF Act, ESI Act, CPCB rules) where relevant
- If search results are insufficient, say "Based on limited search data" rather than making things up
- Do NOT use emoji
- The key_points_to_note should be actionable warnings/thresholds, not generic advice"""

    result = ai_json(prompt, max_tokens=2000)

    if result:
        # Ensure key_points_to_note exists (renamed from key_thresholds)
        if "key_thresholds" in result and "key_points_to_note" not in result:
            result["key_points_to_note"] = result.pop("key_thresholds")
        return result

    # Fallback with industry-relevant info
    return {
        "requirements_summary": f"{buyer_name} requires suppliers to report on BRSR Core KPIs including GHG emissions, water usage, waste management, and worker safety. Specific requirements for {industry} sector could not be retrieved from web search.",
        "relevance_to_msme": f"As a {industry} MSME, you need to demonstrate compliance with environmental and social standards. The applicability of {buyer_name}'s specific requirements to your sector needs to be verified directly with their procurement team.",
        "what_msme_should_do": f"1. Measure all 9 BRSR Core KPIs accurately. 2. Ensure 100% ESI/PF compliance for all workers. 3. Install energy monitoring (sub-meters). 4. Set up waste disposal with authorized recycler. 5. Document all safety training.",
        "supplier_compliance": f"Specific audit framework for {buyer_name} not available. Contact their procurement team for supplier onboarding requirements.",
        "key_points_to_note": [
            "GHG emissions reporting (Scope 1 + Scope 2) is mandatory",
            "LTIFR (Lost Time Injury Frequency Rate) tracking required",
            "Waste disposal must be through authorized recyclers with certificates",
            f"All workers must have ESI/PF registration (mandatory for 20+ employees)",
            "Maintain documentation for audit readiness — most buyers audit within 6 months",
        ],
    }


def search_government_schemes(industry, state):
    """Search for government schemes/subsidies applicable to this MSME."""
    if not SERPER_API_KEY or "paste" in (SERPER_API_KEY or ""):
        return _fallback_schemes(state)
    try:
        resp = requests.post(
            "https://google.serper.dev/search",
            headers={"X-API-KEY": SERPER_API_KEY,
                     "Content-Type": "application/json"},
            json={
                "q": f"government schemes MSME {industry} {state} green sustainability subsidy 2024 2025",
                "num": 5, "gl": "in",
            },
            timeout=10,
        )
        if resp.status_code == 200:
            return [
                {"title": r.get("title", ""), "snippet": r.get(
                    "snippet", ""), "link": r.get("link", "")}
                for r in resp.json().get("organic", [])[:5]
            ]
    except Exception:
        pass
    return _fallback_schemes(state)


# ═══════════════════════════════════════════════════════════════════════
# FALLBACK DATA (when Serper API is unavailable)
# ═══════════════════════════════════════════════════════════════════════

def _fallback(buyer_name):
    """Hardcoded fallback for common buyers when API is down."""
    fb = {
        "Tata Group": [{"title": "Tata Supplier Code", "snippet": "Tata requires GHG, water, waste, safety, gender diversity reporting. 25% renewable by 2027.", "link": "https://www.tata.com/sustainability"}],
        "H&M": [{"title": "H&M Supplier Sustainability", "snippet": "H&M requires carbon, water per unit, chemical management, living wages, 100% renewable by 2030.", "link": "https://hmgroup.com/sustainability"}],
        "Reliance Industries": [{"title": "Reliance ESG Framework", "snippet": "BRSR Core compliance, energy intensity, GHG, water, waste, OHS metrics required.", "link": "https://www.ril.com/sustainability"}],
        "Nike": [{"title": "Nike Manufacturing Standards", "snippet": "100% renewable, zero waste to landfill, 25% water reduction, fair wages required.", "link": "https://www.nike.com/sustainability"}],
        "Apple": [{"title": "Apple Supplier Responsibility", "snippet": "100% renewable for production, Scope 1+2 reporting, zero waste, strict labor standards.", "link": "https://www.apple.com/supplier-responsibility"}],
        "IKEA": [{"title": "IKEA IWAY Standards", "snippet": "CO2 reduction, 100% renewable, 90% waste recycled, safe conditions, above minimum wage.", "link": "https://www.ikea.com/sustainability"}],
        "Zara/Inditex": [{"title": "Inditex Standards", "snippet": "50% GHG reduction by 2030, 80% renewable, 40% water recycling, LTIFR below 1.0.", "link": "https://www.inditex.com/sustainability"}],
        "Tesla": [{"title": "Tesla Supplier Sustainability", "snippet": "Carbon footprint reporting, renewable energy, minimize waste, safe workplaces, conflict minerals.", "link": "https://www.tesla.com/sustainability"}],
    }
    for k, v in fb.items():
        if k.lower() in buyer_name.lower() or buyer_name.lower() in k.lower():
            return v
    return [{"title": f"{buyer_name} — No specific ESG data found", "snippet": f"We could not find specific ESG supplier requirements for {buyer_name}. The assessment will use standard BRSR Core benchmarks. Contact {buyer_name} procurement team for accurate requirements.", "link": ""}]


def _fallback_schemes(state):
    """Fallback government schemes when API is down."""
    return [
        {"title": "PM-KUSUM Solar", "snippet": "40% central + 30% state subsidy for rooftop solar.",
            "link": "https://mnre.gov.in"},
        {"title": "SIDBI Green Finance", "snippet": "Low-interest loans for green technology.",
            "link": "https://www.sidbi.in"},
        {"title": "ZED Certification", "snippet": "Zero Defect Zero Effect with financial incentives.",
            "link": "https://zed.msme.gov.in"},
    ]
