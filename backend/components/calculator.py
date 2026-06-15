
# ═══════════════════════════════════════════════════════════════════════
# REGULATORY CONSTANTS — each with source documentation
# ═══════════════════════════════════════════════════════════════════════

# Grid emission factor for Indian electricity
# Source: Central Electricity Authority, CO2 Baseline Database v19 (2023)
# URL: https://cea.nic.in/co2-baseline-database/
GRID_EF = 0.82  # kg CO2 per kWh

# Energy conversion factor
# Source: Bureau of Energy Efficiency (BEE), India
ENERGY_CONVERSION = 0.0036  # GJ per kWh

# Standard working hours per worker per year
# Source: Indian Factories Act 1948, Section 51 (48 hours/week x 50 weeks)
STD_HOURS = 2400

# Working days per year for Indian manufacturing MSMEs
# Source: BRSR Core assumption — 25 days/month x 12 months
# Most Indian factories operate 6 days/week, deducting public holidays
WORKING_DAYS_PER_YEAR = 300

# Score assigned when MSME provides no data for a KPI
# Not 0 (punitive) and not 90 (inflated) — neutral score
# indicating "we can't assess this because you didn't report it"
NO_DATA_SCORE = 45
NO_DATA_TIER = "No data"
NO_DATA_REASON = "No data was provided for this KPI. Score is neutral (45/100) — not penalized, but not credited. Provide actual measurements to get an accurate score."

# Threshold for zero-incident suspicion
# Below this number of workers, zero safety incidents is plausible
# Above this, zero incidents is statistically unusual and monitored by greenwash detector
MIN_WORKERS_FOR_SAFETY_SUSPICION = 50

# Fuel emission factors
# Source: IPCC 2006 Guidelines for National GHG Inventories, Vol 2, Ch 2
FUEL_FACTORS = {
    "diesel":     {"co2": 2.68, "gj": 0.0384, "unit": "litre",
                   "source": "IPCC 2006 Table 2.2 — Gas/Diesel Oil"},
    "petrol":     {"co2": 2.31, "gj": 0.0342, "unit": "litre",
                   "source": "IPCC 2006 Table 2.2 — Motor Gasoline"},
    "lpg":        {"co2": 1.51, "gj": 0.0473, "unit": "kg",
                   "source": "IPCC 2006 Table 2.2 — LPG"},
    "coal":       {"co2": 2.42, "gj": 0.0293, "unit": "kg",
                   "source": "IPCC 2006 Table 2.2 — Sub-bituminous Coal"},
    "furnaceoil": {"co2": 3.15, "gj": 0.0404, "unit": "litre",
                   "source": "IPCC 2006 Table 2.2 — Residual Fuel Oil"},
    "natgas":     {"co2": 2.04, "gj": 0.0364, "unit": "m3",
                   "source": "IPCC 2006 Table 2.2 — Natural Gas"},
}

# State minimum wages (Rs/day)
# Source: Ministry of Labour & Employment, Gazette Notifications 2024-25
STATE_MIN_WAGES = {
    "Tamil Nadu": 371, "Karnataka": 374, "Maharashtra": 398, "Gujarat": 357,
    "Andhra Pradesh": 340, "Telangana": 361, "Kerala": 400, "West Bengal": 340,
    "Rajasthan": 350, "Uttar Pradesh": 340, "Madhya Pradesh": 331, "Delhi": 410,
    "Punjab": 371, "Haryana": 382, "Bihar": 310, "Odisha": 330,
    "Jharkhand": 331, "Chhattisgarh": 331, "Assam": 320, "Goa": 380,
    "Himachal Pradesh": 350, "Uttarakhand": 350,
}

# Backward compatibility aliases
KWH_TO_GJ = ENERGY_CONVERSION


# ═══════════════════════════════════════════════════════════════════════
# SCORING BENCHMARKS — the heart of explainability
# ═══════════════════════════════════════════════════════════════════════
# Each benchmark tier has: threshold, score, label, source, and reasoning.
# When the system gives a score of 90 for GHG, the user sees exactly
# WHY: "Your GHG intensity is 0.03 tCO2e/unit, which is below 0.05.
# This meets the 'Excellent' tier benchmark from BRSR Core P6-E1."

BENCHMARKS = {
    "ghg_intensity": {
        "metric": "GHG intensity (tCO2e per production unit)",
        "direction": "lower_is_better",
        "tiers": [
            {"max": 0.05,         "score": 90, "label": "Excellent",
             "reason": "GHG intensity below 0.05 tCO2e/unit indicates highly efficient operations with low carbon footprint per unit of output."},
            {"max": 0.2,          "score": 70, "label": "Good",
             "reason": "GHG intensity between 0.05-0.2 tCO2e/unit meets BRSR Core baseline expectations for most manufacturing sectors."},
            {"max": 0.5,          "score": 50, "label": "Moderate",
             "reason": "GHG intensity between 0.2-0.5 tCO2e/unit is above average. Consider renewable energy or fuel switching to reduce emissions."},
            {"max": float("inf"), "score": 30, "label": "Poor",
             "reason": "GHG intensity above 0.5 tCO2e/unit indicates high carbon operations. Immediate action needed — most buyers will flag this."},
        ],
        "source": "BRSR Core P6-E1, aligned with Science Based Targets initiative (SBTi) sectoral benchmarks",
    },
    "energy_intensity": {
        "metric": "Energy intensity (GJ per production unit)",
        "direction": "lower_is_better",
        "tiers": [
            {"max": 0.01,         "score": 90, "label": "Excellent",
             "reason": "Energy intensity below 0.01 GJ/unit — highly energy-efficient. Meets BEE 5-star equivalent for most sectors."},
            {"max": 0.05,         "score": 70, "label": "Good",
             "reason": "Energy intensity 0.01-0.05 GJ/unit — meets BEE 3-star equivalent. Acceptable for most buyer audits."},
            {"max": 0.15,         "score": 50, "label": "Moderate",
             "reason": "Energy intensity 0.05-0.15 GJ/unit — below BEE minimum standards. Energy audit recommended."},
            {"max": float("inf"), "score": 30, "label": "Poor",
             "reason": "Energy intensity above 0.15 GJ/unit — energy-intensive operations. Consider equipment upgrade and solar installation."},
        ],
        "source": "Bureau of Energy Efficiency (BEE) star rating methodology for industrial consumers",
    },
    "water_recycling_pct": {
        "metric": "Percentage of water recycled/reused",
        "direction": "higher_is_better",
        "tiers": [
            {"min": 30,  "score": 90, "label": "Excellent",
             "reason": "Recycling 30%+ of water indicates mature water management with ETP/STP systems in place."},
            {"min": 15,  "score": 70, "label": "Good",
             "reason": "Recycling 15-30% of water meets CPCB minimum discharge norms for most industries."},
            {"min": 5,   "score": 50, "label": "Moderate",
             "reason": "Recycling 5-15% is below CPCB expectations. Most buyers require at least 20% recycling."},
            {"min": 0,   "score": 30, "label": "Poor",
             "reason": "Less than 5% water recycling. This will fail most buyer audits and may violate CPCB discharge norms."},
        ],
        "source": "CPCB Effluent Discharge Standards, BRSR Core P6-W1",
    },
    "waste_disposal": {
        "metric": "Waste disposal method traceability",
        "direction": "categorical",
        "tiers": [
            {"method": "Authorized Recycler (with certificate)", "score": 85, "label": "Excellent",
             "reason": "Authorized recycler with certificate provides full traceability. Meets all buyer audit requirements."},
            {"method": "traceable_recycling", "score": 75, "label": "Good",
             "reason": "Recycling/composting is good but without authorized recycler certificate, traceability is limited."},
            {"method": "Municipal pickup", "score": 50, "label": "Moderate",
             "reason": "Municipal pickup has no traceability. Buyer auditors cannot verify where waste ends up."},
            {"method": "other", "score": 30, "label": "Poor",
             "reason": "Landfill/incineration/unknown disposal will fail buyer audits. Switch to authorized recycler."},
        ],
        "source": "CPCB Solid Waste Management Rules 2016, BRSR Core P6-WS1",
    },
    "gender_diversity_pct": {
        "metric": "Women as percentage of total workforce",
        "direction": "higher_is_better",
        "tiers": [
            {"min": 30,  "score": 90, "label": "Excellent",
             "reason": "30%+ women in workforce exceeds most buyer diversity targets and BRSR Core expectations."},
            {"min": 20,  "score": 70, "label": "Good",
             "reason": "20-30% women meets the median Indian manufacturing benchmark per BRSR Core Principle 3."},
            {"min": 10,  "score": 50, "label": "Moderate",
             "reason": "10-20% women is below most buyer expectations. Consider targeted recruitment initiatives."},
            {"min": 0,   "score": 30, "label": "Poor",
             "reason": "Below 10% women. Most international buyers (H&M, Nike, IKEA) will flag this in supplier audits."},
        ],
        "source": "BRSR Core Principle 3 (P3-S1), ILO Gender Equality Guidelines",
    },
    "wage_ratio": {
        "metric": "Actual wage / State minimum wage ratio",
        "direction": "higher_is_better",
        "tiers": [
            {"min": 1.5, "score": 90, "label": "Excellent",
             "reason": "Paying 1.5x or more of minimum wage indicates fair compensation above living wage threshold."},
            {"min": 1.0, "score": 70, "label": "Good",
             "reason": "Paying at or above minimum wage is legally compliant. Meets baseline for all buyer audits."},
            {"min": 0.8, "score": 40, "label": "Below minimum",
             "reason": "Paying 80-100% of minimum wage is a LEGAL VIOLATION under the Minimum Wages Act 1948. Immediate correction required."},
            {"min": 0,   "score": 10, "label": "Critical violation",
             "reason": "Paying below 80% of minimum wage is a severe legal violation. Contract termination risk with all buyers."},
        ],
        "source": "Minimum Wages Act 1948, Ministry of Labour state notifications 2024-25",
    },
    "ltifr": {
        "metric": "Lost Time Injury Frequency Rate",
        "direction": "lower_is_better",
        "tiers": [
            {"max": 1,            "score": 90, "label": "Excellent",
             "reason": "LTIFR below 1.0 is excellent safety performance, meeting ILO 'best practice' threshold."},
            {"max": 3,            "score": 70, "label": "Good",
             "reason": "LTIFR 1-3 is acceptable per Indian Factories Act standards. Most buyers accept this range."},
            {"max": 6,            "score": 50, "label": "Moderate",
             "reason": "LTIFR 3-6 is above Indian manufacturing average of 4.2. Safety improvements needed."},
            {"max": float("inf"), "score": 30, "label": "Poor",
             "reason": "LTIFR above 6 indicates serious safety issues. Will fail all buyer safety audits."},
        ],
        "source": "Indian Factories Act 1948, ILO Code of Practice on Recording and Notification",
    },
    "complaint_resolution_pct": {
        "metric": "Percentage of complaints resolved",
        "direction": "higher_is_better",
        "tiers": [
            {"min": 90,  "score": 90, "label": "Excellent",
             "reason": "90%+ resolution rate demonstrates strong governance and complaint management systems."},
            {"min": 70,  "score": 70, "label": "Good",
             "reason": "70-90% resolution is acceptable but indicates some complaints are falling through the cracks."},
            {"min": 50,  "score": 50, "label": "Moderate",
             "reason": "50-70% resolution rate suggests weak complaint management. Buyer auditors will note this."},
            {"min": 0,   "score": 30, "label": "Poor",
             "reason": "Below 50% resolution rate indicates governance failure. Immediate process improvement needed."},
        ],
        "source": "BRSR Core Principle 1 (P1-G1), Companies Act 2013 Section 177",
    },
    "circularity_pct": {
        "metric": "Material circularity rate (100 - waste/input %)",
        "direction": "higher_is_better",
        "tiers": [
            {"min": 80,  "score": 90, "label": "Excellent",
             "reason": "80%+ circularity means less than 20% of input becomes waste. Meets Ellen MacArthur Foundation targets."},
            {"min": 60,  "score": 70, "label": "Good",
             "reason": "60-80% circularity is good for Indian manufacturing. Meets BRSR Core baseline."},
            {"min": 40,  "score": 50, "label": "Moderate",
             "reason": "40-60% circularity — significant material loss. Review process efficiency and waste streams."},
            {"min": 0,   "score": 30, "label": "Poor",
             "reason": "Below 40% circularity indicates high waste generation relative to input. Major efficiency gaps."},
        ],
        "source": "BRSR Core P6-C1, Ellen MacArthur Foundation Circularity Indicators",
    },
}


# ═══════════════════════════════════════════════════════════════════════
# SCORING FUNCTIONS — with reasoning output
# ═══════════════════════════════════════════════════════════════════════

def score_lower_is_better(value, benchmark_key):
    """Score a metric where lower values are better (GHG, energy, LTIFR).
    Returns: (score, tier_label, reasoning, benchmark_source)
    """
    bm = BENCHMARKS[benchmark_key]
    for tier in bm["tiers"]:
        if value < tier["max"]:
            return (
                tier["score"],
                tier["label"],
                tier["reason"],
                bm["source"],
            )
    # If value exceeds all tiers, return worst
    last = bm["tiers"][-1]
    return (last["score"], last["label"], last["reason"], bm["source"])


def score_higher_is_better(value, benchmark_key):
    """Score a metric where higher values are better (recycling %, diversity %).
    Returns: (score, tier_label, reasoning, benchmark_source)
    """
    bm = BENCHMARKS[benchmark_key]
    for tier in bm["tiers"]:
        if value >= tier["min"]:
            return (
                tier["score"],
                tier["label"],
                tier["reason"],
                bm["source"],
            )
    last = bm["tiers"][-1]
    return (last["score"], last["label"], last["reason"], bm["source"])


def score_waste_disposal(disposal_method):
    """Score waste disposal by traceability method.
    Returns: (score, tier_label, reasoning, benchmark_source)
    """
    bm = BENCHMARKS["waste_disposal"]
    traceable_methods = [
        "Recycler/Scrap dealer", "Composting",
        "Authorized Recycler (with certificate)",
    ]

    if disposal_method == "Authorized Recycler (with certificate)":
        tier = bm["tiers"][0]
    elif disposal_method in traceable_methods:
        tier = bm["tiers"][1]
    elif disposal_method == "Municipal pickup":
        tier = bm["tiers"][2]
    else:
        tier = bm["tiers"][3]

    return (tier["score"], tier["label"], tier["reason"], bm["source"])


# ═══════════════════════════════════════════════════════════════════════
# MAIN KPI CALCULATION
# ═══════════════════════════════════════════════════════════════════════

def calculate_all_kpis(data):
    """
    Calculate all 9 BRSR Core KPIs from raw MSME data.

    Each KPI returns:
        - value: calculated metric value
        - display_value: formatted string for UI
        - score: 0-100 score with benchmark justification
        - formula: step-by-step calculation showing your numbers
        - formula_source: regulatory source for the formula
        - score_reasoning: plain English explanation of WHY this score
        - score_tier: which benchmark tier this falls into
        - benchmark_source: where the scoring thresholds come from
        - confidence: "measured" if based on real data, "estimated" if defaults used
    """

    def num(key, default=0):
        """Safely extract numeric value from data dict."""
        val = data.get(key, default)
        try:
            return float(val) if val else 0
        except (ValueError, TypeError):
            return 0

    # ─── RAW DATA EXTRACTION ───
    electricity_monthly = num("electricity_units")
    electricity_annual = electricity_monthly * 12
    renewable_monthly = num("renewable_units")
    renewable_annual = renewable_monthly * 12

    # Multi-fuel calculation (Scope 1 emissions)
    scope1_co2 = 0
    fuel_energy_gj = 0
    fuel_detail_parts = []

    for fuel_key, factors in FUEL_FACTORS.items():
        monthly_qty = num(f"fuel_{fuel_key}")
        if monthly_qty > 0:
            annual_qty = monthly_qty * 12
            co2_tonnes = (annual_qty * factors["co2"]) / 1000
            energy_gj = annual_qty * factors["gj"]
            scope1_co2 += co2_tonnes
            fuel_energy_gj += energy_gj
            fuel_detail_parts.append(
                f"{fuel_key.title()}: {annual_qty:,.0f} {factors['unit']}/yr "
                f"x {factors['co2']} kg CO2/{factors['unit']} = {co2_tonnes:.2f} tonnes"
            )

    # Backward compatibility: old single fuel field
    old_fuel = num("fuel_litres")
    old_type = data.get("fuel_type", "Diesel").lower().replace(" ", "")
    if old_fuel > 0 and scope1_co2 == 0:
        ff = FUEL_FACTORS.get(old_type, FUEL_FACTORS["diesel"])
        annual_qty = old_fuel * 12
        scope1_co2 = (annual_qty * ff["co2"]) / 1000
        fuel_energy_gj = annual_qty * ff["gj"]
        fuel_detail_parts.append(
            f"{old_type.title()}: {annual_qty:,.0f} x {ff['co2']} = {scope1_co2:.2f}t"
        )

    # Scope 2 emissions (grid electricity)
    scope2_co2 = (electricity_annual * GRID_EF) / 1000
    total_ghg = scope1_co2 + scope2_co2

    # Water
    water_daily_litres = num("water_daily_litres")
    water_annual_kl = (water_daily_litres * WORKING_DAYS_PER_YEAR) / 1000
    water_recycled_daily = num("water_recycled_daily")
    water_recycled_kl = (water_recycled_daily * WORKING_DAYS_PER_YEAR) / 1000

    # Waste
    waste_nonhaz_annual_t = (num("waste_nonhaz_kg") * 12) / 1000
    waste_haz_annual_t = (num("waste_haz_kg") * 12) / 1000
    total_waste = waste_nonhaz_annual_t + waste_haz_annual_t
    raw_material_annual_t = (num("raw_material_kg") * 12) / 1000

    # Social
    workers = num("workers")
    women_workers = num("women_workers")
    safety_incidents = num("safety_incidents")
    lost_workdays = num("lost_workdays")
    workers_with_benefits = num("workers_with_benefits")
    wages_paid = num("wages_paid")

    # Governance
    complaints_total = num("complaints_total")
    complaints_resolved = num("complaints_resolved")

    # Production
    production_annual = num("production_qty") * 12
    production_unit = data.get("production_unit", "units")
    state = data.get("state", "")

    # ─── DERIVED METRICS ───
    total_energy_gj = (
        electricity_annual * ENERGY_CONVERSION
        + fuel_energy_gj
        + renewable_annual * ENERGY_CONVERSION
    )
    total_electricity = electricity_annual + renewable_annual
    renewable_pct = (renewable_annual / total_electricity *
                     100) if total_electricity > 0 else 0

    ghg_intensity = total_ghg / production_annual if production_annual > 0 else 0
    energy_intensity = total_energy_gj / \
        production_annual if production_annual > 0 else 0
    water_intensity = water_annual_kl / \
        production_annual if production_annual > 0 else 0
    water_recycled_pct = (water_recycled_kl /
                          water_annual_kl * 100) if water_annual_kl > 0 else 0
    waste_intensity = total_waste / production_annual if production_annual > 0 else 0

    women_pct = (women_workers / workers * 100) if workers > 0 else 0
    min_wage = STATE_MIN_WAGES.get(state, 340)
    wage_ratio = wages_paid / min_wage if min_wage > 0 else 0
    total_hours = workers * STD_HOURS if workers > 0 else 1
    ltifr = (safety_incidents * 1_000_000) / \
        total_hours if total_hours > 0 else 0
    resolution_rate = (complaints_resolved / complaints_total *
                       100) if complaints_total > 0 else 100
    circularity = max(0, min(100, (1 - total_waste / raw_material_annual_t)
                      * 100)) if raw_material_annual_t > 0 else 50

    waste_disposal = data.get("waste_disposal", "Unknown")
    is_traceable = waste_disposal in [
        "Authorized Recycler (with certificate)",
        "Recycler/Scrap dealer", "Composting",
    ]

    fuel_formula = " | ".join(
        fuel_detail_parts) if fuel_detail_parts else "No fuel used"

    # ─── SCORE EACH KPI WITH FULL REASONING ───

    def build_kpi(kpi_number, kpi_name, brsr_ref, value, display_value, unit,
                  intensity_value, intensity_unit, formula, formula_source,
                  score, tier_label, score_reasoning, benchmark_source,
                  confidence, extra=None):
        """Build a standardized KPI dict with complete explainability."""
        # Apply fuzzy classification (5-level Gaussian MFs)
        fuzzy = {}
        try:
            from components.fuzzy_scorer import fuzzy_classify_kpi
            fuzzy = fuzzy_classify_kpi(score)
        except ImportError:
            fuzzy = {"dominant": tier_label.lower(
            ) if tier_label else "moderate"}

        result = {
            "kpi_number": kpi_number,
            "kpi_name": kpi_name,
            "brsr_ref": brsr_ref,
            "value": round(value, 4) if isinstance(value, float) else value,
            "display_value": display_value,
            "unit": unit,
            "intensity_value": round(intensity_value, 4) if intensity_value is not None else None,
            "intensity_unit": intensity_unit,
            "formula": formula,
            "formula_source": formula_source,
            "score": score,
            "score_tier": tier_label,
            "score_reasoning": score_reasoning,
            "benchmark_source": benchmark_source,
            "status": "good" if score >= 70 else "moderate" if score >= 50 else "poor",
            "confidence": confidence,
            "fuzzy": fuzzy,
        }
        if extra:
            result["extra"] = extra
        return result

    # KPI 1: GHG Footprint
    has_energy_data = electricity_monthly > 0 or scope1_co2 > 0
    if has_energy_data:
        ghg_score, ghg_tier, ghg_reason, ghg_bm_src = score_lower_is_better(
            ghg_intensity, "ghg_intensity")
    else:
        ghg_score, ghg_tier, ghg_reason, ghg_bm_src = (
            NO_DATA_SCORE, NO_DATA_TIER, NO_DATA_REASON,
            "N/A — no energy data provided")

    kpi_1 = build_kpi(
        kpi_number=1,
        kpi_name="GHG Footprint",
        brsr_ref="P6-E1",
        value=total_ghg,
        display_value=f"{total_ghg:,.2f}",
        unit="tonnes CO2e/year",
        intensity_value=ghg_intensity,
        intensity_unit=f"tCO2e/{production_unit}",
        formula=(
            f"Scope 2 (grid electricity): {electricity_annual:,.0f} kWh/yr x "
            f"{GRID_EF} kg CO2/kWh / 1000 = {scope2_co2:.2f} tonnes\n"
            f"Scope 1 (fuel combustion): {fuel_formula}\n"
            f"Total GHG = {scope2_co2:.2f} + {scope1_co2:.2f} = {total_ghg:.2f} tonnes CO2e/year\n"
            f"Intensity = {total_ghg:.2f} tonnes / {production_annual:,.0f} {production_unit} = "
            f"{ghg_intensity:.4f} tCO2e/{production_unit}"
        ),
        formula_source="CEA CO2 Baseline Database v19 (grid factor), IPCC 2006 Vol 2 Ch 2 (fuel factors)",
        score=ghg_score,
        tier_label=ghg_tier,
        score_reasoning=(
            f"Your GHG intensity is {ghg_intensity:.4f} tCO2e/{production_unit}. "
            f"{ghg_reason}"
        ),
        benchmark_source=ghg_bm_src,
        confidence="measured" if electricity_monthly > 0 else "estimated",
    )

    # KPI 2: Energy Footprint
    has_energy = electricity_monthly > 0 or fuel_energy_gj > 0
    if has_energy:
        energy_score, energy_tier, energy_reason, energy_bm_src = score_lower_is_better(
            energy_intensity, "energy_intensity")
        # Renewable energy bonus
        if renewable_pct > 20:
            energy_score = min(100, energy_score + int(renewable_pct * 0.1))
    else:
        energy_score, energy_tier, energy_reason, energy_bm_src = (
            NO_DATA_SCORE, NO_DATA_TIER, NO_DATA_REASON,
            "N/A — no energy data provided")

    kpi_2 = build_kpi(
        kpi_number=2,
        kpi_name="Energy Footprint",
        brsr_ref="P6-E2",
        value=total_energy_gj,
        display_value=f"{total_energy_gj:,.1f}",
        unit="GJ/year",
        intensity_value=energy_intensity,
        intensity_unit=f"GJ/{production_unit}",
        formula=(
            f"Grid electricity: {electricity_annual:,.0f} kWh x {ENERGY_CONVERSION} GJ/kWh = "
            f"{electricity_annual * ENERGY_CONVERSION:.1f} GJ\n"
            f"Fuel energy: {fuel_energy_gj:.1f} GJ\n"
            f"Renewable: {renewable_annual * ENERGY_CONVERSION:.1f} GJ\n"
            f"Total = {total_energy_gj:.1f} GJ/year\n"
            f"Intensity = {total_energy_gj:.1f} GJ / {production_annual:,.0f} {production_unit} = "
            f"{energy_intensity:.4f} GJ/{production_unit}"
        ),
        formula_source="Bureau of Energy Efficiency (BEE), energy conversion standard",
        score=energy_score,
        tier_label=energy_tier,
        score_reasoning=(
            f"Your energy intensity is {energy_intensity:.4f} GJ/{production_unit}. "
            f"{energy_reason}"
        ),
        benchmark_source=energy_bm_src,
        confidence="measured" if electricity_monthly > 0 else "estimated",
        extra=f"Renewable energy: {renewable_pct:.1f}% of total electricity",
    )

    # KPI 3: Water Footprint
    if water_daily_litres > 0:
        water_score, water_tier, water_reason, water_bm_src = score_higher_is_better(
            water_recycled_pct, "water_recycling_pct")
    else:
        water_score, water_tier, water_reason, water_bm_src = (
            NO_DATA_SCORE, NO_DATA_TIER, NO_DATA_REASON,
            "N/A — no water data provided")

    kpi_3 = build_kpi(
        kpi_number=3,
        kpi_name="Water Footprint",
        brsr_ref="P6-W1",
        value=water_annual_kl,
        display_value=f"{water_annual_kl:,.1f}",
        unit="KL/year",
        intensity_value=water_intensity,
        intensity_unit=f"KL/{production_unit}",
        formula=(
            f"Daily usage: {water_daily_litres:,.0f} litres/day x "
            f"{WORKING_DAYS_PER_YEAR} working days / 1000 = {water_annual_kl:,.1f} KL/year\n"
            f"Daily recycled: {water_recycled_daily:,.0f} litres/day → "
            f"{water_recycled_kl:.1f} KL/year ({water_recycled_pct:.1f}% recycled)"
        ),
        formula_source="BRSR Core P6-W1 disclosure, CPCB effluent standards",
        score=water_score,
        tier_label=water_tier,
        score_reasoning=(
            f"You recycle {water_recycled_pct:.1f}% of your water. "
            f"{water_reason}"
        ),
        benchmark_source=water_bm_src,
        confidence="measured" if water_daily_litres > 0 else "estimated",
        extra=f"Recycled: {water_recycled_pct:.1f}% ({water_recycled_kl:.1f} KL/year)",
    )

    # KPI 4: Waste Management
    if num("waste_nonhaz_kg") > 0 or num("waste_haz_kg") > 0:
        waste_score, waste_tier, waste_reason, waste_bm_src = score_waste_disposal(
            waste_disposal)
    else:
        waste_score, waste_tier, waste_reason, waste_bm_src = (
            NO_DATA_SCORE, NO_DATA_TIER, NO_DATA_REASON,
            "N/A — no waste data provided")

    kpi_4 = build_kpi(
        kpi_number=4,
        kpi_name="Waste Management",
        brsr_ref="P6-WS1",
        value=total_waste,
        display_value=f"{total_waste:,.2f}",
        unit="tonnes/year",
        intensity_value=waste_intensity,
        intensity_unit=f"tonnes/{production_unit}",
        formula=(
            f"Non-hazardous: {num('waste_nonhaz_kg'):,.0f} kg/month x 12 / 1000 = "
            f"{waste_nonhaz_annual_t:.2f} tonnes\n"
            f"Hazardous: {num('waste_haz_kg'):,.0f} kg/month x 12 / 1000 = "
            f"{waste_haz_annual_t:.2f} tonnes\n"
            f"Total waste: {total_waste:.2f} tonnes/year\n"
            f"Disposal method: {waste_disposal}"
        ),
        formula_source="BRSR Core P6-WS1, CPCB Solid Waste Management Rules 2016",
        score=waste_score,
        tier_label=waste_tier,
        score_reasoning=(
            f"Your disposal method is '{waste_disposal}'. "
            f"{waste_reason}"
        ),
        benchmark_source=waste_bm_src,
        confidence="measured" if num("waste_nonhaz_kg") > 0 else "estimated",
        extra=(
            f"Non-hazardous: {waste_nonhaz_annual_t:.2f}T | "
            f"Hazardous: {waste_haz_annual_t:.2f}T | "
            f"Disposal: {'Traceable' if is_traceable else waste_disposal}"
        ),
    )

    # KPI 5: Gender Diversity
    if workers > 0:
        gender_score, gender_tier, gender_reason, gender_bm_src = score_higher_is_better(
            women_pct, "gender_diversity_pct")
    else:
        gender_score, gender_tier, gender_reason, gender_bm_src = (
            NO_DATA_SCORE, NO_DATA_TIER, NO_DATA_REASON,
            "N/A — no workforce data provided")

    kpi_5 = build_kpi(
        kpi_number=5,
        kpi_name="Gender Diversity",
        brsr_ref="P3-S1",
        value=women_pct,
        display_value=f"{women_pct:.1f}%",
        unit="women in workforce",
        intensity_value=None,
        intensity_unit=None,
        formula=f"{women_workers:.0f} women / {workers:.0f} total workers x 100 = {women_pct:.1f}%",
        formula_source="BRSR Core Principle 3 (P3-S1)",
        score=gender_score,
        tier_label=gender_tier,
        score_reasoning=(
            f"Women make up {women_pct:.1f}% of your workforce "
            f"({women_workers:.0f} out of {workers:.0f}). "
            f"{gender_reason}"
        ),
        benchmark_source=gender_bm_src,
        confidence="measured",
    )

    # KPI 6: Wage Parity
    if wages_paid > 0 and workers > 0:
        wage_score, wage_tier, wage_reason, wage_bm_src = score_higher_is_better(
            wage_ratio, "wage_ratio")
    else:
        wage_score, wage_tier, wage_reason, wage_bm_src = (
            NO_DATA_SCORE, NO_DATA_TIER, NO_DATA_REASON,
            "N/A — no wage data provided")

    kpi_6 = build_kpi(
        kpi_number=6,
        kpi_name="Wage Parity",
        brsr_ref="P3-S2",
        value=wage_ratio,
        display_value=f"{wage_ratio:.2f}x",
        unit=f"ratio vs Rs {min_wage}/day minimum ({state})",
        intensity_value=None,
        intensity_unit=None,
        formula=(
            f"Lowest wage paid: Rs {wages_paid:.0f}/day\n"
            f"State minimum ({state}): Rs {min_wage}/day\n"
            f"Ratio = {wages_paid:.0f} / {min_wage} = {wage_ratio:.2f}x"
        ),
        formula_source=f"Minimum Wages Act 1948, {state} notification 2024-25",
        score=wage_score,
        tier_label=wage_tier,
        score_reasoning=(
            f"You pay Rs {wages_paid:.0f}/day, which is {wage_ratio:.2f}x the "
            f"{state} minimum of Rs {min_wage}/day. "
            f"{wage_reason}"
        ),
        benchmark_source=wage_bm_src,
        confidence="measured" if wages_paid > 0 else "unknown",
    )

    # KPI 7: Occupational Safety
    if workers > 0:
        if safety_incidents == 0 and workers < MIN_WORKERS_FOR_SAFETY_SUSPICION:
            # Small workshop — zero incidents is plausible
            safety_score, safety_tier = 90, "Excellent"
            safety_reason = "Zero injuries with a small workforce is plausible. Good safety record."
            safety_bm_src = BENCHMARKS["ltifr"]["source"]
        elif safety_incidents == 0 and workers >= MIN_WORKERS_FOR_SAFETY_SUSPICION:
            # Large workforce — zero incidents is suspicious but not penalized harshly
            # Greenwash detector handles this separately
            safety_score, safety_tier = 75, "Good"
            safety_reason = (
                f"Zero injuries reported with {workers:.0f} workers. Statistically unusual for "
                f"manufacturing with {workers:.0f}+ workers — greenwash detector monitors this. "
                f"Score is 75 (not 90) to reflect uncertainty."
            )
            safety_bm_src = BENCHMARKS["ltifr"]["source"]
        else:
            safety_score, safety_tier, safety_reason, safety_bm_src = score_lower_is_better(
                ltifr, "ltifr")
    else:
        safety_score, safety_tier, safety_reason, safety_bm_src = (
            NO_DATA_SCORE, NO_DATA_TIER, NO_DATA_REASON,
            "N/A — no workforce data provided")

    kpi_7 = build_kpi(
        kpi_number=7,
        kpi_name="Occupational Safety (LTIFR)",
        brsr_ref="P3-S3",
        value=ltifr,
        display_value=f"{ltifr:.2f}",
        unit="Lost Time Injury Frequency Rate",
        intensity_value=None,
        intensity_unit=None,
        formula=(
            f"LTIFR = (injuries x 1,000,000) / (workers x standard hours)\n"
            f"= ({safety_incidents:.0f} x 1,000,000) / ({workers:.0f} x {STD_HOURS:,})\n"
            f"= {ltifr:.2f}"
        ),
        formula_source="Indian Factories Act 1948 Section 88, ILO standard formula",
        score=safety_score,
        tier_label=safety_tier,
        score_reasoning=(
            f"Your LTIFR is {ltifr:.2f} ({safety_incidents:.0f} injuries among "
            f"{workers:.0f} workers). {safety_reason}"
        ),
        benchmark_source=safety_bm_src,
        confidence="measured" if workers > 0 else "estimated",
        extra=f"Injuries: {safety_incidents:.0f} | Lost days: {lost_workdays:.0f} | Workers: {workers:.0f}",
    )

    # KPI 8: Governance
    # Detect if user actually filled in any data at all
    any_data_entered = (electricity_monthly > 0 or workers > 0 or
                        water_daily_litres > 0 or wages_paid > 0 or
                        num("waste_nonhaz_kg") > 0 or production_annual > 0)

    if complaints_total > 0:
        gov_score, gov_tier, gov_reason, gov_bm_src = score_higher_is_better(
            resolution_rate, "complaint_resolution_pct")
    elif complaints_total == 0 and complaints_resolved == 0 and any_data_entered:
        # User filled other data but got zero complaints — genuinely no complaints
        gov_score, gov_tier = 70, "Good"
        gov_reason = ("No complaints were received in the reporting period. "
                      "This is a positive indicator, though buyers may verify "
                      "whether a formal complaint mechanism exists.")
        gov_bm_src = BENCHMARKS["complaint_resolution_pct"]["source"]
    else:
        # No data entered at all — can't assess
        gov_score, gov_tier, gov_reason, gov_bm_src = (
            NO_DATA_SCORE, NO_DATA_TIER, NO_DATA_REASON,
            "N/A — no governance data provided")

    kpi_8 = build_kpi(
        kpi_number=8,
        kpi_name="Governance — Complaint Resolution",
        brsr_ref="P1-G1",
        value=resolution_rate,
        display_value=f"{resolution_rate:.0f}%",
        unit="complaints resolved",
        intensity_value=None,
        intensity_unit=None,
        formula=(
            f"{complaints_resolved:.0f} resolved / {complaints_total:.0f} total "
            f"x 100 = {resolution_rate:.0f}%"
        ),
        formula_source="BRSR Core Principle 1 (P1-G1)",
        score=gov_score,
        tier_label=gov_tier,
        score_reasoning=(
            f"You resolved {resolution_rate:.0f}% of complaints "
            f"({complaints_resolved:.0f} out of {complaints_total:.0f}). "
            f"{gov_reason}"
        ),
        benchmark_source=gov_bm_src,
        confidence="measured",
    )

    # KPI 9: Circularity
    if raw_material_annual_t > 0:
        circ_score, circ_tier, circ_reason, circ_bm_src = score_higher_is_better(
            circularity, "circularity_pct")
    else:
        circ_score, circ_tier, circ_reason, circ_bm_src = (
            NO_DATA_SCORE, NO_DATA_TIER, NO_DATA_REASON,
            "N/A — no raw material data provided")

    kpi_9 = build_kpi(
        kpi_number=9,
        kpi_name="Circularity",
        brsr_ref="P6-C1",
        value=circularity,
        display_value=f"{circularity:.1f}%",
        unit="material circularity rate",
        intensity_value=round(
            total_waste / raw_material_annual_t, 4) if raw_material_annual_t > 0 else None,
        intensity_unit="waste/raw material ratio",
        formula=(
            f"Waste generated: {total_waste:.2f} tonnes/year\n"
            f"Raw material input: {raw_material_annual_t:.2f} tonnes/year\n"
            f"Waste ratio = {total_waste:.2f} / {raw_material_annual_t:.2f} = "
            f"{(total_waste / raw_material_annual_t * 100):.1f}%\n"
            f"Circularity = 100% - {(total_waste / raw_material_annual_t * 100):.1f}% = {circularity:.1f}%"
        ) if raw_material_annual_t > 0 else "Insufficient raw material data to calculate circularity",
        formula_source="BRSR Core P6-C1, Ellen MacArthur Foundation methodology",
        score=circ_score,
        tier_label=circ_tier,
        score_reasoning=(
            f"Your material circularity is {circularity:.1f}%. "
            f"{circ_reason}"
        ),
        benchmark_source=circ_bm_src,
        confidence="measured" if raw_material_annual_t > 0 else "estimated",
    )

    return [kpi_1, kpi_2, kpi_3, kpi_4, kpi_5, kpi_6, kpi_7, kpi_8, kpi_9]


def get_overall_score(kpis):
    """Average of all KPI scores, with special handling for no-data assessments."""
    if not kpis:
        return 0

    # Check if ALL KPIs are NO_DATA
    no_data_count = sum(1 for k in kpis if k.get("score_tier") == NO_DATA_TIER)
    if no_data_count == len(kpis):
        return 0  # Truly no data — score is 0, not 45

    # For mixed data: only average KPIs that have real data
    real_kpis = [k for k in kpis if k.get("score_tier") != NO_DATA_TIER]
    if real_kpis:
        return round(sum(k["score"] for k in real_kpis) / len(real_kpis))
    return 0


def has_meaningful_data(kpis):
    """Check if the assessment has enough real data to produce valid scores.
    Returns True if at least 3 KPIs have actual data (not NO_DATA).
    Used by frontend to decide whether to show scores or a 'please enter data' message.
    """
    if not kpis:
        return False
    real_count = sum(1 for k in kpis if k.get("score_tier") != NO_DATA_TIER)
    return real_count >= 3


# ═══════════════════════════════════════════════════════════════════════
# BUYER BONUS MODIFIERS — adjusts buyer readiness, NOT the ESG score
# ═══════════════════════════════════════════════════════════════════════

def apply_bonus_modifiers(kpis, bonus_answers, buyer_name):
    """
    Take buyer-specific bonus question answers and compute a
    buyer_readiness adjustment for each relevant KPI.

    This does NOT change the base ESG score (that stays as calculated
    from the 9 BRSR KPIs). Instead, it returns a separate
    buyer_readiness_adjustments dict that the gap_analyzer uses.

    Example:
        Buyer: H&M
        Bonus answer: {"bonus_chemical_management": "No"}
        → Waste Management KPI gets a -10 buyer readiness penalty
        → reasoning: "H&M requires chemical management certification
           for textile suppliers. You answered 'No', reducing your
           buyer readiness for this KPI."

    Returns:
        {
            "adjustments": [
                {
                    "kpi_name": "Waste Management",
                    "adjustment": -10,
                    "reason": "...",
                    "buyer_requirement": "Chemical management certification",
                    "your_answer": "No"
                }
            ],
            "total_adjustment": -10,
            "buyer_name": "H&M"
        }
    """
    if not bonus_answers or not buyer_name:
        return {"adjustments": [], "total_adjustment": 0, "buyer_name": buyer_name}

    adjustments = []

    # Map common bonus fields to KPI impacts
    BONUS_IMPACT_MAP = {
        # Chemical management → Waste Management
        "bonus_chemical_management": {
            "kpi": "Waste Management",
            "positive_values": ["Yes", "yes", "Certified", "certified"],
            "penalty": -10,
            "reward": 5,
            "requirement": "Chemical management certification (ZDHC/OEKO-TEX)",
        },
        # Conflict minerals → Governance
        "bonus_conflict_minerals": {
            "kpi": "Governance — Complaint Resolution",
            "positive_values": ["Yes", "yes", "Compliant", "compliant"],
            "penalty": -15,
            "reward": 5,
            "requirement": "Conflict minerals due diligence (Dodd-Frank/EU regulation)",
        },
        # Supply chain traceability → Circularity
        "bonus_supply_traceability": {
            "kpi": "Circularity",
            "positive_values": ["Yes", "yes", "Full", "full"],
            "penalty": -10,
            "reward": 5,
            "requirement": "Supply chain traceability system",
        },
        # Carbon offset → GHG
        "bonus_carbon_offset": {
            "kpi": "GHG Footprint",
            "positive_values": ["Yes", "yes"],
            "penalty": 0,
            "reward": 10,
            "requirement": "Carbon offset or neutrality program",
        },
        # Living wage commitment → Wage Parity
        "bonus_living_wage": {
            "kpi": "Wage Parity",
            "positive_values": ["Yes", "yes"],
            "penalty": -10,
            "reward": 5,
            "requirement": "Living wage commitment (above minimum wage)",
        },
        # Child labor audit → Gender Diversity (social category)
        "bonus_child_labor_audit": {
            "kpi": "Gender Diversity",
            "positive_values": ["Yes", "yes", "Passed", "passed"],
            "penalty": -20,
            "reward": 5,
            "requirement": "Third-party child labor audit",
        },
    }

    for field_key, answer_value in bonus_answers.items():
        if not field_key.startswith("bonus_"):
            continue

        impact = BONUS_IMPACT_MAP.get(field_key)
        if not impact:
            # Unknown bonus field — still record it
            adjustments.append({
                "kpi_name": "General",
                "adjustment": 0,
                "reason": f"Buyer-specific question '{field_key}' answered: '{answer_value}'. "
                f"No automated scoring impact — reviewed during gap analysis.",
                "buyer_requirement": field_key.replace("bonus_", "").replace("_", " ").title(),
                "your_answer": str(answer_value),
            })
            continue

        is_positive = str(answer_value) in impact["positive_values"]
        adjustment = impact["reward"] if is_positive else impact["penalty"]

        adjustments.append({
            "kpi_name": impact["kpi"],
            "adjustment": adjustment,
            "reason": (
                f"{buyer_name} requires: {impact['requirement']}. "
                f"You answered '{answer_value}'. "
                f"{'This meets the requirement (+{} points to buyer readiness).'.format(impact['reward']) if is_positive else 'This does not meet the requirement ({} points to buyer readiness). Action needed before buyer audit.'.format(impact['penalty'])}"
            ),
            "buyer_requirement": impact["requirement"],
            "your_answer": str(answer_value),
        })

    total_adj = sum(a["adjustment"] for a in adjustments)

    return {
        "adjustments": adjustments,
        "total_adjustment": total_adj,
        "buyer_name": buyer_name,
    }
