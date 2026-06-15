import math

# ═══════════════════════════════════════════════════════
# MEMBERSHIP FUNCTIONS (pure Python, no external library)
# ═══════════════════════════════════════════════════════


def gaussian_mf(x, mean, sigma):
    """Gaussian membership function. Bell curve centered at mean with spread sigma."""
    if sigma == 0:
        return 1.0 if x == mean else 0.0
    return math.exp(-0.5 * ((x - mean) / sigma) ** 2)


def triangular_mf(x, a, b, c):
    """Triangular MF. Peak at b, zero at a and c."""
    if x <= a or x >= c:
        return 0.0
    elif x <= b:
        return (x - a) / (b - a) if b != a else 1.0
    else:
        return (c - x) / (c - b) if c != b else 1.0


def trapezoidal_mf(x, a, b, c, d):
    """Trapezoidal MF. Flat top between b and c, zero outside a and d."""
    if x <= a or x >= d:
        return 0.0
    elif a < x < b:
        return (x - a) / (b - a) if b != a else 1.0
    elif b <= x <= c:
        return 1.0
    else:
        return (d - x) / (d - c) if d != c else 1.0


def sigmoid_mf(x, center, steepness):
    """Sigmoid (S-curve) MF. Rises from 0 to 1 around center."""
    try:
        return 1.0 / (1.0 + math.exp(-steepness * (x - center)))
    except OverflowError:
        return 0.0 if steepness * (x - center) < 0 else 1.0


# ═══════════════════════════════════════════════════════
# 1. FUZZY KPI CLASSIFICATION (5 levels)
# ═══════════════════════════════════════════════════════

# 5-level Gaussian membership functions
# Designed so boundaries OVERLAP — a score of 68 has membership in
# both "Good" and "Moderate" simultaneously. This is the key insight
# of fuzzy logic: no crisp cutoffs.

KPI_FUZZY_SETS = {
    # Peak at 95, tight (only truly exceptional)
    "excellent": {"mean": 95, "sigma": 5},
    "good":      {"mean": 75, "sigma": 10},   # Peak at 75, moderate spread
    "moderate":  {"mean": 50, "sigma": 10},   # Peak at 50, moderate spread
    "poor":      {"mean": 25, "sigma": 10},   # Peak at 25, moderate spread
    # Peak at 5, tight (only truly terrible)
    "critical":  {"mean": 5,  "sigma": 5},
}

# Color palette for fuzzy-blended display
FUZZY_COLORS = {
    "excellent": (16, 185, 129),   # Emerald green (#10B981)
    "good":      (45, 106, 79),    # Forest green (#2D6A4F)
    "moderate":  (184, 134, 11),   # Dark goldenrod (#B8860B)
    "poor":      (220, 38, 38),    # Red (#DC2626)
    "critical":  (127, 29, 29),    # Dark red (#7F1D1D)
}


def fuzzy_classify_kpi(score):
    """
    Classify a KPI score (0-100) into 5 fuzzy categories with degree of membership.

    Returns dict with:
    - memberships: {excellent: 0.12, good: 0.78, moderate: 0.35, poor: 0.0, critical: 0.0}
    - dominant: "good" (highest membership)
    - color: "#2D6A4F" (blended RGB based on membership weights)
    - explanation: human-readable fuzzy interpretation
    - defuzzified: centroid-based crisp score
    """
    score = max(0, min(100, score))

    # Calculate membership in each fuzzy set
    memberships = {}
    for name, params in KPI_FUZZY_SETS.items():
        memberships[name] = round(gaussian_mf(
            score, params["mean"], params["sigma"]), 4)

    # Normalize memberships so they sum to 1 (for percentage interpretation)
    total = sum(memberships.values())
    if total > 0:
        normalized = {k: round(v / total, 4) for k, v in memberships.items()}
    else:
        normalized = {k: 0.2 for k in memberships}  # Uniform if all zero

    # Dominant category (highest raw membership)
    dominant = max(memberships, key=memberships.get)

    # Secondary category (second highest, if significant)
    sorted_m = sorted(normalized.items(), key=lambda x: x[1], reverse=True)
    secondary = sorted_m[1][0] if len(
        sorted_m) > 1 and sorted_m[1][1] > 0.15 else None

    # Blend color based on normalized memberships
    r, g, b = 0, 0, 0
    for name, degree in normalized.items():
        cr, cg, cb = FUZZY_COLORS[name]
        r += cr * degree
        g += cg * degree
        b += cb * degree
    color = "#{:02x}{:02x}{:02x}".format(int(r), int(g), int(b))

    # Defuzzify using centroid method
    centers = {"excellent": 95, "good": 75,
               "moderate": 50, "poor": 25, "critical": 5}
    numerator = sum(memberships[k] * centers[k] for k in memberships)
    denominator = sum(memberships.values())
    defuzzified = round(numerator / denominator,
                        1) if denominator > 0 else 50.0

    # Generate explanation
    top_two = sorted_m[:2]
    if top_two[0][1] > 0.80:
        explanation = f"Score {score} is clearly {top_two[0][0]} — meets buyer expectations." if top_two[0][0] in [
            "excellent", "good"] else f"Score {score} is {top_two[0][0]} — needs {'targeted' if top_two[0][0] == 'moderate' else 'immediate'} improvement."
    elif secondary:
        explanation = f"Score {score} is on the boundary: {top_two[0][0]} ({top_two[0][1]:.0%}) and {top_two[1][0]} ({top_two[1][1]:.0%}) — {'meets buyer expectations.' if top_two[0][0] in ['excellent', 'good'] else 'needs improvement.'}"
    else:
        explanation = f"Score {score} classified as {dominant}."

    return {
        "memberships": memberships,
        "normalized": normalized,
        "dominant": dominant,
        "secondary": secondary,
        "color": color,
        "defuzzified": defuzzified,
        "explanation": explanation,
    }


# ═══════════════════════════════════════════════════════
# 2. BUYER-ADAPTIVE PILLAR-WEIGHTED ESG SCORE
# ═══════════════════════════════════════════════════════

# Default pillar weights from SEBI BRSR Core KPI distribution
# 5 Environmental KPIs, 3 Social KPIs, 1 Governance KPI → 55:33:11
# Rounded to 55:30:15 with slight governance uplift for compliance emphasis
DEFAULT_PILLAR_WEIGHTS = {"Environmental": 0.55,
                          "Social": 0.30, "Governance": 0.15}

# KPI to pillar mapping (fixed by BRSR Core definition)
KPI_PILLAR_MAP = {
    "GHG Footprint": "Environmental",
    "Energy Footprint": "Environmental",
    "Water Footprint": "Environmental",
    "Waste Management": "Environmental",
    "Circularity": "Environmental",
    "Gender Diversity": "Social",
    "Wage Parity": "Social",
    "Occupational Safety (LTIFR)": "Social",
    "Governance — Complaint Resolution": "Governance",
}

# Keyword-to-pillar mapping for dynamic weight extraction
# When the AI buyer summary mentions these words, we increase the corresponding pillar weight
ENVIRONMENTAL_KEYWORDS = [
    "carbon", "emission", "ghg", "co2", "greenhouse", "climate", "energy", "renewable",
    "solar", "electricity", "water", "waste", "recycl", "circular", "pollution", "effluent",
    "discharge", "environment", "footprint", "biodiversity", "deforestation", "chemical",
    "hazardous", "toxic", "ozone", "sustainability", "green", "eco", "clean", "nature",
    "resource", "conservation", "packaging", "plastic", "zero waste", "net zero",
]

SOCIAL_KEYWORDS = [
    "wage", "salary", "worker", "labour", "labor", "safety", "incident", "injury",
    "gender", "women", "diversity", "inclusion", "training", "skill", "benefit",
    "insurance", "esi", "pf", "provident", "health", "wellbeing", "child",
    "forced", "human right", "fair", "living wage", "minimum wage", "community",
    "working condition", "overtime", "harassment", "discrimination", "union",
    "freedom", "association", "employee", "occupational", "ppe", "protective",
]

GOVERNANCE_KEYWORDS = [
    "governance", "compliance", "audit", "transparency", "report", "disclosure",
    "complaint", "grievance", "ethics", "corruption", "bribery", "anti-corruption",
    "board", "accountability", "policy", "regulation", "legal", "data privacy",
    "cybersecurity", "whistle", "code of conduct", "supply chain", "traceability",
    "certification", "iso", "standard", "documentation", "record", "verification",
]


def extract_weights_from_text(buyer_summary_text):
    """
    Dynamically extract pillar weights from buyer summary text.

    Novel approach: Instead of hardcoding buyer profiles, we analyze the 
    AI-generated buyer summary to determine what the buyer ACTUALLY cares about.

    Method:
    1. Count keyword mentions for each pillar (E, S, G)
    2. Apply sigmoid normalization to avoid extreme weights
    3. Ensure minimum floor (10%) for each pillar
    4. Normalize to sum to 1.0

    This means:
    - Works for ANY buyer in the world (not just 20 hardcoded ones)
    - Adapts automatically when buyer changes their focus
    - Based on REAL published requirements found via web search
    - Reproducible: same text → same weights every time

    Args:
        buyer_summary_text: concatenated text from all buyer summary sections

    Returns:
        dict with Environmental, Social, Governance weights summing to 1.0
    """
    if not buyer_summary_text or len(buyer_summary_text.strip()) < 20:
        return DEFAULT_PILLAR_WEIGHTS.copy()

    text_lower = buyer_summary_text.lower()

    # Count keyword hits for each pillar
    e_count = sum(1 for kw in ENVIRONMENTAL_KEYWORDS if kw in text_lower)
    s_count = sum(1 for kw in SOCIAL_KEYWORDS if kw in text_lower)
    g_count = sum(1 for kw in GOVERNANCE_KEYWORDS if kw in text_lower)

    total_hits = e_count + s_count + g_count

    if total_hits == 0:
        return DEFAULT_PILLAR_WEIGHTS.copy()

    # Raw proportions
    e_raw = e_count / total_hits
    s_raw = s_count / total_hits
    g_raw = g_count / total_hits

    # Apply floor: minimum 10% for any pillar (SEBI requires all three)
    FLOOR = 0.10
    e_adj = max(FLOOR, e_raw)
    s_adj = max(FLOOR, s_raw)
    g_adj = max(FLOOR, g_raw)

    # Apply ceiling: maximum 65% for any pillar (prevent one pillar dominating)
    CEILING = 0.65
    e_adj = min(CEILING, e_adj)
    s_adj = min(CEILING, s_adj)
    g_adj = min(CEILING, g_adj)

    # Normalize to sum to 1.0
    total = e_adj + s_adj + g_adj
    weights = {
        "Environmental": round(e_adj / total, 2),
        "Social": round(s_adj / total, 2),
        "Governance": round(g_adj / total, 2),
    }

    # Fix rounding to exactly 1.0
    diff = 1.0 - sum(weights.values())
    weights["Environmental"] = round(weights["Environmental"] + diff, 2)

    return weights


def get_buyer_weights(buyer_name, buyer_summary=None):
    """
    Get pillar weights adapted to the specific buyer.

    Priority:
    1. If buyer_summary text is provided → extract weights dynamically from text
    2. If not → fall back to SEBI BRSR Core default (55/30/15)

    This is the novel approach: weights are DERIVED from the AI's buyer analysis,
    not hardcoded. Every buyer in the world gets personalized weights.

    Args:
        buyer_name: name of the target buyer
        buyer_summary: dict with buyer summary sections (from AI analysis)

    Returns:
        dict with weights and metadata about how they were derived
    """
    # Try dynamic extraction from buyer summary
    if buyer_summary and isinstance(buyer_summary, dict):
        # Concatenate all summary sections into one text
        all_text = " ".join(str(v) for v in buyer_summary.values() if v)

        if len(all_text.strip()) > 50:
            weights = extract_weights_from_text(all_text)
            return {
                "weights": weights,
                "method": "dynamic_extraction",
                "source": f"Derived from AI analysis of {buyer_name}'s published ESG requirements",
                "buyer_name": buyer_name or "Unknown",
            }

    # Fallback to SEBI default
    return {
        "weights": DEFAULT_PILLAR_WEIGHTS.copy(),
        "method": "sebi_default",
        "source": "SEBI BRSR Core default (5E:3S:1G KPI distribution)",
        "buyer_name": buyer_name or "SEBI Default",
    }


def fuzzy_overall_score(kpis, buyer_name="", company_data=None):
    """
    Calculate buyer-adaptive pillar-weighted ESG score.

    Novel approach:
    1. Get buyer-specific pillar weights (not static)
    2. Group 9 KPIs into 3 pillars
    3. Calculate pillar averages
    4. Apply buyer weights
    5. Apply critical gap penalty (-5 per KPI below 30)
    6. Apply zero-data penalty (KPIs with no real data)
    7. Return score with full transparency on how it was calculated

    Args:
        kpis: list of KPI dicts from calculator.py
        buyer_name: target buyer name for adaptive weighting
        company_data: company info for context

    Returns:
        dict with score, pillar_scores, weights_used, penalty, explanation
    """
    if not kpis:
        return {"score": 0, "pillar_scores": {}, "weights_used": {},
                "penalty": 0, "critical_gaps": [], "explanation": "No KPI data available."}

    # Get buyer-adaptive weights (dynamically from summary text, not hardcoded)
    buyer_summary = (company_data or {}).get("buyer_summary", None)
    weight_result = get_buyer_weights(buyer_name, buyer_summary)
    weights = weight_result["weights"]
    weight_method = weight_result["method"]
    weight_source = weight_result["source"]

    # Group KPIs by pillar
    pillar_kpis = {"Environmental": [], "Social": [], "Governance": []}
    for kpi in kpis:
        pillar = KPI_PILLAR_MAP.get(kpi.get("kpi_name", ""), "Governance")
        pillar_kpis[pillar].append(kpi)

    # Calculate pillar averages (excluding zero-data KPIs from average)
    pillar_scores = {}
    for pillar, pkpis in pillar_kpis.items():
        if not pkpis:
            pillar_scores[pillar] = 0
            continue

        valid_scores = []
        for k in pkpis:
            score = k.get("score", 0)
            confidence = k.get("confidence", "measured")
            # Don't penalize in average but track zero-data separately
            valid_scores.append(score)

        pillar_scores[pillar] = round(
            sum(valid_scores) / len(valid_scores), 1) if valid_scores else 0

    # Apply buyer weights
    weighted_score = sum(pillar_scores.get(
        p, 0) * w for p, w in weights.items())

    # Critical gap penalty: -5 for each KPI below 30
    critical_gaps = [k["kpi_name"] for k in kpis if k.get("score", 0) < 30]
    penalty = len(critical_gaps) * 5

    # Zero-data penalty: -3 for each KPI with estimated/no real data
    zero_data_kpis = [k["kpi_name"] for k in kpis
                      if k.get("confidence", "") == "estimated" and k.get("value", 0) == 0]
    zero_penalty = len(zero_data_kpis) * 3

    # Final score
    # Final score before greenwash adjustment
    pre_greenwash_score = max(
        0, min(100, round(weighted_score - penalty - zero_penalty, 1)))

    # Greenwash discount: if greenwash risk is high, ESG score should be reduced
    # This ensures high greenwash risk → lower ESG score (no contradiction)
    # Formula: discount = greenwash_risk * 0.3 (max 30% reduction)
    # Example: greenwash 70 → discount 21 points, greenwash 20 → discount 6 points
    greenwash_discount = 0
    if company_data and "greenwash_risk" in company_data:
        gw_risk = float(company_data.get("greenwash_risk", 0))
        greenwash_discount = round(gw_risk * 0.3, 1)

    final_score = max(
        0, min(100, round(pre_greenwash_score - greenwash_discount, 1)))

    # Fuzzy classify the overall score
    overall_fuzzy = fuzzy_classify_kpi(final_score)

    # Generate explanation
    weight_str = " + ".join([f"{p} {w:.0%}" for p, w in weights.items()])
    calc_str = " + ".join(
        [f"({pillar_scores.get(p, 0):.1f} × {w})" for p, w in weights.items()])

    explanation_parts = [
        f"Buyer-adaptive weights for {buyer_name or 'SEBI default'}: {weight_str}",
        f"Calculation: {calc_str} = {weighted_score:.1f}",
    ]
    if penalty > 0:
        explanation_parts.append(
            f"Critical gap penalty: -{penalty} ({len(critical_gaps)} KPI(s) below 30)")
    if zero_penalty > 0:
        explanation_parts.append(
            f"Missing data penalty: -{zero_penalty} ({len(zero_data_kpis)} KPI(s) with no data)")
    explanation_parts.append(
        f"Final: {final_score} — {overall_fuzzy['dominant']}")

    return {
        "score": final_score,
        "pillar_scores": pillar_scores,
        "weights_used": weights,
        "buyer_name": buyer_name or "SEBI BRSR Core Default",
        "weight_method": weight_method,
        "weight_source": weight_source,
        "is_buyer_adaptive": weight_method == "dynamic_extraction",
        "penalty": penalty,
        "zero_penalty": zero_penalty,
        "critical_gaps": critical_gaps,
        "zero_data_kpis": zero_data_kpis,
        "fuzzy": overall_fuzzy,
        "explanation": " | ".join(explanation_parts),
    }


# ═══════════════════════════════════════════════════════
# 3. MAMDANI FIS — GREENWASH RISK DETECTION
# ═══════════════════════════════════════════════════════

# Step 1: Define input linguistic variables (8 greenwash signals)
# Each signal is fuzzified from raw data into degree of truth [0,1]

def _fuzzify_wage_signal(wages_paid, state_minimum):
    """Wage violation signal. Lower wages = higher degree."""
    if state_minimum <= 0 or wages_paid <= 0:
        return 0.0
    ratio = wages_paid / state_minimum
    # trapezoidal: fully suspicious below 0.7, partially up to 1.0
    return trapezoidal_mf(ratio, 0, 0, 0.70, 1.0)


def _fuzzify_mass_balance_signal(production_kg, waste_kg, raw_material_kg):
    """Mass balance anomaly. Large unaccounted material = high degree."""
    if raw_material_kg <= 0:
        return 0.0
    accounted = production_kg + waste_kg
    gap_pct = max(0, (raw_material_kg - accounted) / raw_material_kg)
    # trapezoidal: suspicious above 15% gap, fully suspicious above 30%
    return trapezoidal_mf(gap_pct, 0.05, 0.15, 1.0, 1.0)


def _fuzzify_electricity_signal(reported_kwh, bill_amount, state_rate):
    """Electricity mismatch signal."""
    if bill_amount <= 0 or state_rate <= 0:
        return 0.0
    expected_kwh = bill_amount / state_rate
    if expected_kwh <= 0:
        return 0.0
    ratio = reported_kwh / expected_kwh
    # Suspicious if ratio is very far from 1.0
    deviation = abs(ratio - 1.0)
    return trapezoidal_mf(deviation, 0.3, 0.5, 2.0, 2.0)


def _fuzzify_hazwaste_signal(haz_kg, industry, is_mandatory_list):
    """Zero hazwaste in mandatory industry."""
    if industry not in is_mandatory_list:
        return 0.0
    if haz_kg <= 0:
        return 1.0  # Fully suspicious — mandatory industry but zero hazwaste
    return 0.0


def _fuzzify_benefit_signal(workers_with_benefits, total_workers):
    """ESI/PF coverage gap signal."""
    if total_workers <= 0 or total_workers < 20:
        return 0.0  # ESI/PF not mandatory below 20 workers
    if workers_with_benefits <= 0:
        return 1.0  # Zero benefits = fully suspicious
    coverage = workers_with_benefits / total_workers
    # trapezoidal: suspicious below 80% coverage
    return trapezoidal_mf(coverage, 0, 0, 0.50, 0.80)


def _fuzzify_safety_signal(incidents, workers):
    """Zero incidents with large workforce — suspiciously clean."""
    if workers < 50 or incidents > 0:
        return 0.0
    # Gaussian suspicion: peaks at 0 incidents, wider with more workers
    workforce_factor = min(1.0, workers / 200)  # Max suspicion at 200+ workers
    return gaussian_mf(incidents, 0, 0.5) * workforce_factor


def _fuzzify_water_signal(recycled_daily, consumed_daily):
    """Water impossibility — recycled > consumed."""
    if consumed_daily <= 0:
        return 0.0
    if recycled_daily > consumed_daily:
        return 1.0  # Physics violation
    ratio = recycled_daily / consumed_daily
    # Suspicious if recycled > 95% (very unusual)
    return trapezoidal_mf(ratio, 0.90, 0.95, 1.0, 1.0)


def _fuzzify_training_signal(training_hours, workers):
    """Zero training hours with workforce — Factories Act violation."""
    if workers < 10:
        return 0.0
    if training_hours <= 0:
        workforce_factor = min(1.0, workers / 100)
        return 0.8 * workforce_factor  # High but not certain
    # Low training: less than 2 hours per worker per year
    per_worker = training_hours / workers if workers > 0 else 0
    return trapezoidal_mf(per_worker, 0, 0, 1.0, 2.0)


# Step 2: Define output linguistic variables for risk level
OUTPUT_MFS = {
    "very_low":  {"type": "triangular", "params": (0, 0, 20)},
    "low":       {"type": "triangular", "params": (10, 25, 40)},
    "medium":    {"type": "triangular", "params": (30, 50, 70)},
    "high":      {"type": "triangular", "params": (60, 75, 90)},
    "very_high": {"type": "triangular", "params": (80, 100, 100)},
}


def _output_mf(x, mf_name):
    """Evaluate output membership function at point x."""
    mf = OUTPUT_MFS[mf_name]
    a, b, c = mf["params"]
    return triangular_mf(x, a, b, c)


# Step 3: Fuzzy rules (Mamdani-style)
# Each rule maps signal combinations to output risk levels
FUZZY_RULES = [
    # Rule 1: Wage violation → high risk
    {"signals": ["wage_violation"], "output": "high", "weight": 1.0,
     "description": "Paying below minimum wage indicates labour law violation"},

    # Rule 2: Mass balance failure → very high risk
    {"signals": ["mass_balance"], "output": "very_high", "weight": 1.0,
     "description": "Material unaccounted for suggests hidden waste or data fabrication"},

    # Rule 3: Electricity mismatch → high risk
    {"signals": ["electricity_mismatch"], "output": "high", "weight": 0.9,
     "description": "Electricity data inconsistency suggests measurement or reporting error"},

    # Rule 4: Zero hazwaste in mandatory industry → medium risk
    {"signals": ["zero_hazwaste"], "output": "medium", "weight": 0.85,
     "description": "Zero hazardous waste in mandatory industry raises compliance questions"},

    # Rule 5: Benefit gap → high risk
    {"signals": ["benefit_gap"], "output": "high", "weight": 1.0,
     "description": "Inadequate ESI/PF coverage violates Indian labour law"},

    # Rule 6: Zero incidents + large workforce → medium risk
    {"signals": ["zero_incidents"], "output": "medium", "weight": 0.7,
     "description": "Zero safety incidents with large workforce is statistically improbable"},

    # Rule 7: Water impossibility → very high risk
    {"signals": ["water_impossible"], "output": "very_high", "weight": 1.0,
     "description": "Recycled water exceeding consumed water violates physics"},

    # Rule 8: Zero training → medium risk
    {"signals": ["zero_training"], "output": "medium", "weight": 0.8,
     "description": "No documented safety training violates Factories Act requirements"},

    # Rule 9: Multiple signals combined → very high risk
    {"signals": ["wage_violation", "benefit_gap"], "output": "very_high", "weight": 1.0,
     "description": "Combined wage violation and benefit gap indicates systematic labour exploitation"},

    # Rule 10: Electricity + mass balance → very high risk
    {"signals": ["electricity_mismatch", "mass_balance"], "output": "very_high", "weight": 1.0,
     "description": "Multiple data inconsistencies suggest deliberate data manipulation"},

    # Rule 11: No signals fired → very low risk
    {"signals": ["_no_signals"], "output": "very_low", "weight": 1.0,
     "description": "No risk patterns detected — data appears internally consistent"},
]


def fuzzy_greenwash_risk(checks, kpis, company_data):
    """
    Proper Mamdani Fuzzy Inference System for greenwash risk detection.

    Process:
    1. FUZZIFICATION: Convert raw data into fuzzy degrees for 8 signals
    2. RULE EVALUATION: Apply fuzzy AND (min) for multi-signal rules
    3. AGGREGATION: Clip output MFs by rule strength, combine with max
    4. DEFUZZIFICATION: Centroid method to get crisp risk score

    Args:
        checks: list of verification check results
        kpis: list of calculated KPIs
        company_data: raw MSME data

    Returns:
        dict with risk_score, risk_label, signals, rules_fired, explanations
    """
    if not company_data:
        company_data = {}

    def n(key, default=0):
        v = company_data.get(key, default)
        try:
            return float(v) if v else 0
        except (ValueError, TypeError):
            return 0

    # Extract needed values
    workers = n("workers")
    wages = n("wages_paid")
    state = company_data.get("state", "")
    industry = company_data.get("industry", "")

    from components.calculator import STATE_MIN_WAGES
    state_min = STATE_MIN_WAGES.get(state, 340)

    HAZWASTE_MANDATORY = ["Textiles & Garments", "Auto Components", "Chemicals & Pharma",
                          "Leather & Footwear", "Metal Fabrication", "Plastics & Rubber",
                          "Electronics Assembly"]

    from components.verifier import ELEC_RATES
    state_rate = ELEC_RATES.get(state, 7.5)

    # ─── STEP 1: FUZZIFICATION ───
    signals = {
        "wage_violation": _fuzzify_wage_signal(wages, state_min),
        "mass_balance": _fuzzify_mass_balance_signal(
            n("production_qty") * 12 *
            (1000 if company_data.get("production_unit") == "Tonnes" else 1),
            (n("waste_nonhaz_kg") + n("waste_haz_kg")) * 12,
            n("raw_material_kg") * 12
        ),
        "electricity_mismatch": _fuzzify_electricity_signal(
            n("electricity_units") * 12, n("electricity_bill") * 12, state_rate
        ),
        "zero_hazwaste": _fuzzify_hazwaste_signal(n("waste_haz_kg"), industry, HAZWASTE_MANDATORY),
        "benefit_gap": _fuzzify_benefit_signal(n("workers_with_benefits"), workers),
        "zero_incidents": _fuzzify_safety_signal(n("safety_incidents"), workers),
        "water_impossible": _fuzzify_water_signal(n("water_recycled_daily"), n("water_daily_litres")),
        "zero_training": _fuzzify_training_signal(n("training_hours"), workers),
    }

    # ─── STEP 2: RULE EVALUATION ───
    rules_fired = []
    any_signal_active = any(v > 0.1 for v in signals.values())

    for rule in FUZZY_RULES:
        if "_no_signals" in rule["signals"]:
            # Special rule: fires only if no other signals are active
            if not any_signal_active:
                strength = 1.0
                rules_fired.append({
                    "rule_id": "R_default",
                    "output": rule["output"],
                    "strength": strength * rule["weight"],
                    "description": rule["description"],
                })
            continue

        # Fuzzy AND: take minimum of signal degrees
        signal_degrees = [signals.get(s, 0) for s in rule["signals"]]
        firing_strength = min(signal_degrees)  # Mamdani AND operator

        if firing_strength > 0.05:  # Threshold to avoid noise
            rules_fired.append({
                "rule_id": f"R{FUZZY_RULES.index(rule) + 1}",
                "output": rule["output"],
                "strength": round(firing_strength * rule["weight"], 4),
                "description": rule["description"],
                "signal_degrees": {s: round(signals.get(s, 0), 3) for s in rule["signals"]},
            })

    # ─── STEP 3: AGGREGATION (max of clipped output MFs) ───
    # Discretize output universe [0, 100] into 101 points
    x_points = list(range(0, 101))
    aggregated = [0.0] * 101

    for rf in rules_fired:
        output_name = rf["output"]
        clip_level = rf["strength"]
        for i, x in enumerate(x_points):
            mf_val = _output_mf(x, output_name)
            clipped = min(mf_val, clip_level)  # Mamdani clipping
            aggregated[i] = max(aggregated[i], clipped)  # Max aggregation

    # ─── STEP 4: DEFUZZIFICATION (centroid) ───
    numerator = sum(x * a for x, a in zip(x_points, aggregated))
    denominator = sum(aggregated)

    if denominator > 0:
        risk_score = round(numerator / denominator, 1)
    else:
        risk_score = 20.0  # Default low risk

    # Classify risk
    if risk_score >= 70:
        risk_label = "High"
    elif risk_score >= 40:
        risk_label = "Medium"
    else:
        risk_label = "Low"

    # Generate explanations
    explanations = []
    for rf in sorted(rules_fired, key=lambda x: x["strength"], reverse=True):
        if rf["strength"] > 0.1:
            sig_detail = ""
            if "signal_degrees" in rf:
                sig_parts = [f"{s} (degree {d:.2f})" for s,
                             d in rf["signal_degrees"].items() if d > 0]
                sig_detail = " — signals: " + ", ".join(sig_parts)
            explanations.append(f"{rf['description']}{sig_detail}")

    if not explanations:
        explanations.append("No significant greenwash risk patterns detected.")

    # Build signal summary for display
    active_signals = {k: round(v, 3) for k, v in signals.items() if v > 0.01}

    return {
        "risk_score": risk_score,
        "risk_label": risk_label,
        "signals": signals,
        "active_signals": active_signals,
        "rules_fired": rules_fired,
        "explanations": explanations,
        "method": "Mamdani FIS with centroid defuzzification",
        "num_rules_fired": len(rules_fired),
    }


# ═══════════════════════════════════════════════════════
# 4. FUZZY DATA CONFIDENCE SCORING
# ═══════════════════════════════════════════════════════

# Category weights: how much each check type affects overall confidence
CONFIDENCE_CATEGORY_WEIGHTS = {
    "identity": 1.5,    # GSTIN, company identity — most critical
    "social": 1.4,      # Wages, safety, benefits — high impact
    "waste": 1.3,       # Mass balance, hazwaste — important
    "energy": 1.2,      # Electricity, fuel — standard
    "water": 1.1,       # Water usage — standard
    "governance": 1.0,  # Complaints — baseline
    "general": 1.0,     # Others
}

# 3-level confidence fuzzy sets with Gaussian MFs
CONFIDENCE_SETS = {
    "reliable":   {"mean": 90, "sigma": 15},
    "uncertain":  {"mean": 50, "sigma": 12},
    "suspicious": {"mean": 15, "sigma": 12},
}


def fuzzy_confidence_score(checks):
    """
    Convert verification checks into fuzzy confidence score.

    Each check (pass/warn/fail) is fuzzified into Reliable/Uncertain/Suspicious.
    Category weights give more importance to identity and social checks.

    Returns:
        dict with score, label, per_check details, and explanation
    """
    if not checks:
        return {
            "score": 50,
            "label": "No Data",
            "per_check": [],
            "explanation": "No verification checks performed.",
        }

    per_check = []

    for check in checks:
        status = check.get("status", "warn")
        category = check.get("category", "general")

        # Map status to raw score
        if status == "pass":
            raw = 90
        elif status == "warn":
            raw = 50
        else:  # fail
            raw = 15

        # Fuzzify into confidence sets
        reliable = gaussian_mf(
            raw, CONFIDENCE_SETS["reliable"]["mean"], CONFIDENCE_SETS["reliable"]["sigma"])
        uncertain = gaussian_mf(
            raw, CONFIDENCE_SETS["uncertain"]["mean"], CONFIDENCE_SETS["uncertain"]["sigma"])
        suspicious = gaussian_mf(
            raw, CONFIDENCE_SETS["suspicious"]["mean"], CONFIDENCE_SETS["suspicious"]["sigma"])

        # Defuzzify
        numerator = reliable * 90 + uncertain * 50 + suspicious * 15
        denominator = reliable + uncertain + suspicious
        defuzzified = numerator / denominator if denominator > 0 else 50

        per_check.append({
            "title": check.get("title", "Unknown"),
            "category": category,
            "status": status,
            "reliable": round(reliable, 3),
            "uncertain": round(uncertain, 3),
            "suspicious": round(suspicious, 3),
            "confidence": round(defuzzified, 1),
        })

    # Weighted aggregation
    weighted_sum = 0
    weight_total = 0
    for pc in per_check:
        w = CONFIDENCE_CATEGORY_WEIGHTS.get(pc["category"], 1.0)
        weighted_sum += pc["confidence"] * w
        weight_total += w

    overall = round(weighted_sum / weight_total, 1) if weight_total > 0 else 50

    # Classify
    if overall >= 75:
        label = "High Confidence"
    elif overall >= 50:
        label = "Moderate Confidence"
    else:
        label = "Low Confidence"

    # Explanation
    suspicious_checks = [pc for pc in per_check if pc["suspicious"] > 0.3]
    uncertain_checks = [pc for pc in per_check if pc["uncertain"] > 0.5]

    explanation_parts = []
    if suspicious_checks:
        names = ", ".join([sc["title"] for sc in suspicious_checks[:3]])
        explanation_parts.append(f"Suspicious data in: {names}")
    if uncertain_checks:
        names = ", ".join([uc["title"] for uc in uncertain_checks[:3]])
        explanation_parts.append(f"Uncertain data in: {names}")
    if not explanation_parts:
        explanation_parts.append("All data points show acceptable reliability")

    return {
        "score": overall,
        "label": label,
        "per_check": per_check,
        "explanation": ". ".join(explanation_parts) + ".",
    }
