"""
╔══════════════════════════════════════════════════════════════════════╗
║  VERIFIER — ESGVerify                                              ║
║  Data validation, GSTIN verification, and cross-consistency checks ║
╚══════════════════════════════════════════════════════════════════════╝

WHAT THIS MODULE DOES:
    1. GSTIN Validation:
       - Format check (15 chars, pattern match)
       - State code validation (first 2 digits → Indian state)
       - Luhn-variant checksum verification (last digit)
       - GSTIN ↔ declared state cross-check
    
    2. State-City Validation:
       - Validates that declared city belongs to declared state
       - Returns error message if mismatch detected
    
    3. Consistency Checks (16 cross-validation rules):
       These are NOT simple if-else checks — they use:
       - Industry benchmarks (kWh/worker ranges by sector)
       - Physical laws (mass balance, water conservation)
       - Statistical improbability (zero incidents with 100+ workers)
       - Legal thresholds (minimum wage, ESI/PF coverage)
       - Cross-field validation (electricity units vs bill amount)
"""

import re

# ═══════════════════════════════════════════════════════════════════════
# REFERENCE DATA
# ═══════════════════════════════════════════════════════════════════════

GSTIN_STATE_CODES = {
    "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
    "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi",
    "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim",
    "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
    "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
    "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh",
    "24": "Gujarat", "26": "Dadra & Nagar Haveli", "27": "Maharashtra",
    "29": "Karnataka", "30": "Goa", "32": "Kerala", "33": "Tamil Nadu",
    "34": "Puducherry", "36": "Telangana", "37": "Andhra Pradesh",
}

STATE_MIN_WAGES = {
    "Tamil Nadu": 371, "Karnataka": 374, "Maharashtra": 398, "Gujarat": 357,
    "Andhra Pradesh": 340, "Telangana": 361, "Kerala": 400, "West Bengal": 340,
    "Rajasthan": 350, "Uttar Pradesh": 340, "Madhya Pradesh": 331, "Delhi": 410,
    "Punjab": 371, "Haryana": 382, "Bihar": 310, "Odisha": 330,
    "Jharkhand": 331, "Chhattisgarh": 331, "Assam": 320, "Goa": 380,
    "Himachal Pradesh": 350, "Uttarakhand": 350,
}

# kWh per worker per YEAR benchmarks (low, high) by industry
ENERGY_PER_WORKER = {
    "Textiles & Garments": (800, 5000), "Food Processing": (600, 4000),
    "Auto Components": (1500, 8000), "Chemicals & Pharma": (2000, 10000),
    "Leather & Footwear": (500, 3000), "Plastics & Rubber": (1000, 6000),
    "Metal Fabrication": (2000, 10000), "Electronics Assembly": (800, 4000),
    "Paper & Packaging": (1500, 7000), "Construction Materials": (1000, 6000),
    "Handicrafts & Artisan": (200, 1500), "Agro & Rural Industry": (300, 2000),
    "IT & Software Services": (300, 1500), "Education & Training": (200, 1000),
    "Healthcare & Diagnostics": (500, 3000), "Hospitality & Food Service": (400, 2500),
    "Logistics & Warehousing": (300, 2000), "Other Manufacturing": (500, 8000),
}

# KL per worker per year benchmarks
WATER_PER_WORKER = {
    "Textiles & Garments": (20, 120), "Food Processing": (30, 150),
    "Auto Components": (10, 80), "Chemicals & Pharma": (25, 130),
    "Leather & Footwear": (40, 180), "Plastics & Rubber": (8, 60),
    "Metal Fabrication": (15, 90), "Electronics Assembly": (5, 50),
    "Paper & Packaging": (40, 200), "Construction Materials": (15, 100),
    "IT & Software Services": (2, 15), "Education & Training": (3, 20),
    "Healthcare & Diagnostics": (10, 60), "Hospitality & Food Service": (15, 80),
    "Logistics & Warehousing": (3, 20), "Other Manufacturing": (10, 100),
}

# Average electricity rate per state (Rs/kWh) for cross-checking bills
ELEC_RATES = {
    "Tamil Nadu": 7.5, "Karnataka": 8.0, "Maharashtra": 9.5, "Gujarat": 7.0,
    "Andhra Pradesh": 7.2, "Delhi": 8.5, "Telangana": 7.5, "Kerala": 6.5,
    "West Bengal": 7.8, "Rajasthan": 7.2, "Uttar Pradesh": 6.8, "Punjab": 7.0,
    "Haryana": 7.5, "Bihar": 6.0, "Odisha": 6.5, "Madhya Pradesh": 7.0,
    "Chhattisgarh": 6.5,
}

# Industry yield benchmarks (output/input ratio)
YIELD_BENCHMARKS = {
    "Textiles & Garments": 0.82, "Food Processing": 0.75, "Auto Components": 0.88,
    "Chemicals & Pharma": 0.90, "Leather & Footwear": 0.70, "Plastics & Rubber": 0.92,
    "Metal Fabrication": 0.85, "Electronics Assembly": 0.95, "Paper & Packaging": 0.80,
    "Construction Materials": 0.90,
}

# Industries that MUST produce hazardous waste
HAZWASTE_MANDATORY = [
    "Textiles & Garments", "Auto Components", "Chemicals & Pharma",
    "Leather & Footwear", "Metal Fabrication", "Plastics & Rubber",
    "Electronics Assembly",
]

# Buyers requiring traceable waste disposal
TRACEABLE_BUYERS = ["H&M", "Zara/Inditex", "IKEA",
                    "Nike", "Apple", "Adidas", "Walmart", "Decathlon"]

# Service sectors where material checks are skipped
SERVICE_SECTORS = [
    "IT & Software Services", "Education & Training", "Healthcare & Diagnostics",
    "Hospitality & Food Service", "Logistics & Warehousing", "Professional Services",
]

# State → major cities mapping for validation
STATE_CITIES = {
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tirupur", "Erode", "Vellore", "Thoothukudi", "Dindigul", "Thanjavur", "Ranipet", "Sivakasi", "Karur", "Hosur", "Ambur", "Kancheepuram", "Kumbakonam"],
    "Karnataka": ["Bangalore", "Bengaluru", "Mysore", "Mysuru", "Hubli", "Mangalore", "Mangaluru", "Belgaum", "Belagavi", "Gulbarga", "Kalaburagi", "Davangere", "Bellary", "Shimoga", "Tumkur"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Sangli", "Amravati", "Navi Mumbai", "Satara", "Raigad", "Pimpri"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Vapi", "Morbi", "Mehsana", "Bharuch", "Navsari"],
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Kakinada", "Rajahmundry", "Tirupati", "Kadapa", "Anantapur", "Eluru"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Mahbubnagar", "Secunderabad", "Rangareddy"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Alappuzha", "Kannur", "Ernakulam", "Malappuram"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Baharampur", "Kharagpur"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Allahabad", "Prayagraj", "Bareilly", "Aligarh", "Moradabad", "Noida", "Greater Noida", "Saharanpur", "Gorakhpur"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam"],
    "Delhi": ["Delhi", "New Delhi", "Noida", "Gurgaon", "Gurugram", "Faridabad", "Ghaziabad"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Hoshiarpur"],
    "Haryana": ["Gurgaon", "Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Sonipat", "Hisar", "Rohtak", "Manesar"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
    "Himachal Pradesh": ["Shimla", "Dharamsala", "Solan", "Mandi", "Kullu", "Baddi"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Haldwani", "Roorkee", "Rudrapur", "Kashipur"],
}


# ═══════════════════════════════════════════════════════════════════════
# GSTIN VALIDATION
# ═══════════════════════════════════════════════════════════════════════

def _gstin_checksum(gstin):
    """
    Validate GSTIN checksum using the GST Luhn algorithm variant.

    The 15th character of a GSTIN is a check digit computed from
    the first 14 characters using a modified Luhn algorithm.
    This catches typos and transposition errors.
    """
    chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    try:
        factor = 1
        total = 0
        for i in range(len(gstin) - 1):
            idx = chars.index(gstin[i])
            digit = idx * factor
            digit = (digit // 36) + (digit % 36)
            total += digit
            factor = 2 if factor == 1 else 1
        remainder = total % 36
        check_digit = chars[(36 - remainder) % 36]
        return check_digit == gstin[14]
    except (ValueError, IndexError):
        return False


def validate_gstin(gstin):
    """
    Full GSTIN validation with specific error messages.

    Returns dict with:
    - valid: bool
    - state: str or None
    - message: str — specific error description
    - status: "pass" / "warn" / "fail"

    Error messages are designed to show BELOW the GSTIN input field.
    """
    r = {"valid": False, "state": None, "message": "", "status": "fail"}

    if not gstin:
        r["message"] = "GSTIN is required"
        return r

    gstin = gstin.strip().upper()

    if len(gstin) != 15:
        r["message"] = f"GSTIN must be exactly 15 characters (you entered {len(gstin)})"
        return r

    if not re.match(  # Correct:
            r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[A-Z0-9]{1}[A-Z0-9]{1}$', gstin):
        r["message"] = "Invalid GSTIN format. Expected: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric"
        return r

    sc = gstin[:2]
    if sc not in GSTIN_STATE_CODES:
        r["message"] = f"Invalid state code '{sc}'. First 2 digits of GSTIN must be a valid Indian state code."
        return r

    # Checksum validation
    if not _gstin_checksum(gstin):
        r.update({
            "valid": True, "state": GSTIN_STATE_CODES[sc],
            "message": f"GSTIN format valid, registered in {GSTIN_STATE_CODES[sc]}, but checksum digit mismatch — possible typo in last character.",
            "status": "warn",
        })
        return r

    r.update({
        "valid": True, "state": GSTIN_STATE_CODES[sc],
        "message": f"Valid GSTIN with correct checksum. Registered in {GSTIN_STATE_CODES[sc]}.",
        "status": "pass",
    })
    return r


def verify_gstin_state_match(gstin, declared_state):
    """Check if GSTIN state matches the declared state."""
    r = validate_gstin(gstin)
    if not r["valid"]:
        return r

    gs = r["state"].lower()
    ds = declared_state.lower()
    match = gs.strip() == ds.strip()

    return {
        "valid": True, "state": r["state"],
        "message": f"GSTIN state ({r['state']}) {'matches' if match else 'does NOT match'} declared state ({declared_state})." +
        ("" if match else " Please check — this will fail a buyer audit."),
        "status": "pass" if match else "warn",
    }


# ═══════════════════════════════════════════════════════════════════════
# STATE-CITY VALIDATION
# ═══════════════════════════════════════════════════════════════════════

def validate_city_state(city, state):
    """
    Validate that the city belongs to the declared state.

    Returns:
        dict with valid, message, status

    Note: This is a soft check — if the city is not in our database,
    we warn but don't fail (our city list isn't exhaustive).
    """
    if not city or not state:
        return {"valid": True, "message": "", "status": "pass"}

    city_clean = city.strip().title()
    state_cities = STATE_CITIES.get(state, [])

    if not state_cities:
        # State not in our mapping — can't verify
        return {"valid": True, "message": f"City validation not available for {state}.", "status": "pass"}

    # Check if city is in the correct state
    city_lower = city_clean.lower()
    state_cities_lower = [c.lower() for c in state_cities]

    if city_lower in state_cities_lower:
        return {"valid": True, "message": f"{city_clean} is a valid city in {state}.", "status": "pass"}

    # Check if city exists in a DIFFERENT state
    for other_state, other_cities in STATE_CITIES.items():
        if other_state == state:
            continue
        if city_lower in [c.lower() for c in other_cities]:
            return {
                "valid": False,
                "message": f"{city_clean} belongs to {other_state}, not {state}. Please check your state or city selection.",
                "status": "fail",
            }

    # City not found in any state — might be a small town we don't have
    return {
        "valid": True,
        "message": f"{city_clean} not found in our database for {state}. This may be a smaller city — please verify.",
        "status": "warn",
    }


# ═══════════════════════════════════════════════════════════════════════
# CONSISTENCY CHECKS (16 cross-validation rules)
# ═══════════════════════════════════════════════════════════════════════

def run_consistency_checks(data):
    """
    Run 16 cross-validation checks on MSME data.

    Each check returns: title, message, status (pass/warn/fail), category

    Categories: energy, water, waste, social, identity, governance

    CHECK LIST:
    ──────────────────────────────────────────────────────────────
    1.  Electricity Bill vs Units — cross-check using state tariff rates
    2.  Energy per Worker — compare against industry benchmarks
    3.  Water per Worker — compare against industry benchmarks
    4.  Water Recycling Validity — recycled cannot exceed consumed
    5.  Water Recycling Rate — most buyers need 20%+
    6.  Water Scarcity Risk — tanker source = risk flag
    7.  Mass Balance Check — production + waste ≈ raw material
    8.  Hazardous Waste Declaration — mandatory for certain industries
    9.  Buyer Waste Traceability — premium buyers need authorized recycler
    10. Yield Benchmark — compare output/input vs industry standard
    11. Waste Ratio — waste as % of raw material
    12. Gender Diversity — women count vs total workers
    13. Safety Records — zero incidents with large workforce = suspicious
    14. ESI/PF Coverage — percentage with benefits
    15. Wage Compliance — vs state minimum wage
    16. Safety Training — zero hours = compliance risk
    17. Statutory ESI/PF — mandatory for 20+ workers
    ──────────────────────────────────────────────────────────────
    """
    checks = []

    def n(k):
        v = data.get(k, 0)
        try:
            return float(v) if v else 0
        except (ValueError, TypeError):
            return 0

    workers = n("workers")
    ind = data.get("industry", "Other Manufacturing")
    state = data.get("state", "")
    buyer = data.get("buyer_name", "")
    eu_monthly = n("electricity_units")
    eb = n("electricity_bill")
    eu = eu_monthly * 12  # Annual
    is_service = ind in SERVICE_SECTORS

    # ─── CHECK 1: Electricity Bill vs Units ───
    if eu_monthly > 0 and eb > 0:
        rate = ELEC_RATES.get(state, 7.5)
        exp = (eb * 12) / rate  # Expected annual kWh from bill
        ratio = eu / exp if exp > 0 else 0
        if 0.5 <= ratio <= 2.0:
            checks.append({"title": "Electricity Bill vs Units",
                           "message": f"Annual {eu:,.0f} kWh ({eu_monthly:,.0f}/month x 12) consistent with Rs {eb:,.0f}/month bill at Rs {rate}/unit.",
                           "status": "pass", "category": "energy"})
        elif 0.3 <= ratio <= 3.0:
            checks.append({"title": "Electricity Bill vs Units",
                           "message": f"Slight mismatch: {eu:,.0f} kWh/year vs expected {exp:,.0f} kWh/year from bill. Check for demand charges or power factor penalties.",
                           "status": "warn", "category": "energy"})
        else:
            checks.append({"title": "Electricity Bill vs Units",
                           "message": f"Major mismatch: {eu:,.0f} kWh/year vs expected {exp:,.0f} kWh/year from bill. Ratio: {ratio:.1f}x. Verify data.",
                           "status": "fail", "category": "energy"})

    # ─── CHECK 2: Energy per Worker ───
    if workers > 0 and eu > 0:
        epw = eu / workers
        lo, hi = ENERGY_PER_WORKER.get(ind, (500, 8000))
        if lo <= epw <= hi:
            checks.append({"title": "Energy per Worker",
                           "message": f"{epw:,.0f} kWh/worker/year within {ind} range ({lo:,}-{hi:,}).",
                           "status": "pass", "category": "energy"})
        else:
            severity = "fail" if (epw < lo * 0.3 or epw > hi * 2) else "warn"
            checks.append({"title": "Energy per Worker",
                           "message": f"{epw:,.0f} kWh/worker/year {'below' if epw < lo else 'above'} {ind} range ({lo:,}-{hi:,}).",
                           "status": severity, "category": "energy"})

    # ─── CHECK 3: Water per Worker ───
    wkl = n("water_kl") or (n("water_daily_litres") * 300 / 1000)
    if workers > 0 and wkl > 0:
        wpw = wkl / workers
        lo, hi = WATER_PER_WORKER.get(ind, (10, 100))
        s = "pass" if lo <= wpw <= hi else (
            "warn" if lo * 0.3 <= wpw <= hi * 2.5 else "fail")
        checks.append({"title": "Water per Worker",
                       "message": f"{wpw:.1f} KL/worker {'within' if s == 'pass' else 'outside'} {ind} range ({lo}-{hi}).",
                       "status": s, "category": "water"})

    # ─── CHECK 4: Water Recycling Validity ───
    wrkl = n("water_recycled_daily") * 300 / \
        1000 if n("water_recycled_daily") > 0 else 0
    if wkl > 0 and wrkl > wkl:
        checks.append({"title": "Water Recycling",
                       "message": "Recycled water exceeds consumed water. This is physically impossible. Please check inputs.",
                       "status": "fail", "category": "water"})

    # ─── CHECK 5: Water Recycling Rate ───
    elif wkl > 0 and wrkl > 0 and (wrkl / wkl * 100) < 20:
        checks.append({"title": "Water Recycling Rate",
                       "message": f"Only {wrkl/wkl*100:.0f}% water recycled. Most buyers require 20%+ water recycling.",
                       "status": "warn", "category": "water"})

    # ─── CHECK 6: Water Scarcity Risk ───
    if data.get("water_source") == "Tanker":
        checks.append({"title": "Water Scarcity Risk",
                       "message": "Tanker is primary source. Consider rainwater harvesting to reduce dependency and cost.",
                       "status": "warn", "category": "water"})

    # ─── CHECK 7: Mass Balance (skip for service sectors) ───
    wkg = (n("waste_nonhaz_kg") + n("waste_haz_kg")) * 12
    rkg = n("raw_material_kg") * 12
    pa = n("production_qty") * 12
    pu = data.get("production_unit", "")

    if not is_service and pu in ["Kg", "Tonnes"] and rkg > 0:
        pw = pa * (1000 if pu == "Tonnes" else 1)
        if (pw + wkg) < (rkg * 0.95):
            miss = rkg - pw - wkg
            miss_pct = (miss / rkg) * 100
            checks.append({"title": "Mass Balance Check",
                           "message": f"Critical: {miss_pct:.0f}% of input material unaccounted for ({miss:,.0f} kg missing). Production ({pw:,.0f} kg) + Waste ({wkg:,.0f} kg) < Raw Material ({rkg:,.0f} kg). This indicates hidden waste disposal. Will fail buyer audit.",
                           "status": "fail", "category": "waste"})
        elif rkg > 0:
            checks.append({"title": "Mass Balance Check",
                           "message": f"Material balanced: Input {rkg:,.0f} kg → Output {pw:,.0f} kg + Waste {wkg:,.0f} kg.",
                           "status": "pass", "category": "waste"})
    elif is_service:
        checks.append({"title": "Sector Type",
                       "message": f"{ind} is a service sector. Mass balance and yield checks not applicable. Emissions from energy and fuel.",
                       "status": "pass", "category": "waste"})

    # ─── CHECK 8: Hazardous Waste Declaration ───
    if ind in HAZWASTE_MANDATORY and n("waste_haz_kg") == 0:
        checks.append({"title": "Hazardous Waste Check",
                       "message": f"Zero hazardous waste for {ind}. Most {ind} units produce used oils, ETP sludge, or chemical waste. This may trigger audit scrutiny.",
                       "status": "warn", "category": "waste"})

    # ─── CHECK 9: Buyer Waste Traceability ───
    wd = data.get("waste_disposal", "")
    if wd in ["Recycler/Scrap dealer", "Landfill"] and buyer and any(b.lower() in buyer.lower() for b in TRACEABLE_BUYERS):
        checks.append({"title": "Buyer Waste Traceability",
                       "message": f"{buyer} requires waste disposal through authorized recyclers with certificates. '{wd}' may not meet their audit requirements.",
                       "status": "warn", "category": "waste"})

    # ─── CHECK 10: Yield Benchmark (skip for services) ───
    bm = YIELD_BENCHMARKS.get(ind)
    if not is_service and bm and rkg > 0 and pu in ["Kg", "Tonnes"]:
        pw = pa * (1000 if pu == "Tonnes" else 1)
        yld = pw / rkg
        if yld < bm:
            checks.append({"title": "Yield Benchmark",
                           "message": f"Yield {yld:.0%} below {ind} benchmark {bm:.0%}. Check for material waste or measurement errors.",
                           "status": "warn", "category": "waste"})

    # ─── CHECK 11: Waste Ratio ───
    wt = (n("waste_nonhaz_kg") + n("waste_haz_kg")) * 12 / 1000
    rt = n("raw_material_kg") * 12 / 1000
    if rt > 0 and wt > 0:
        wr = wt / rt
        if wr <= 0.5:
            checks.append({"title": "Waste Ratio",
                           "message": f"Waste is {wr*100:.1f}% of raw material. Within normal range.",
                           "status": "pass", "category": "waste"})
        elif wr <= 0.8:
            checks.append({"title": "Waste Ratio",
                           "message": f"Waste is {wr*100:.1f}% of raw material. Higher than typical for {ind}.",
                           "status": "warn", "category": "waste"})
        else:
            checks.append({"title": "Waste Ratio",
                           "message": f"Waste is {wr*100:.0f}% of raw material. Unusual — verify inputs.",
                           "status": "fail", "category": "waste"})

    # ─── CHECK 12: Gender Diversity ───
    wm = n("women_workers")
    if wm > workers and workers > 0:
        checks.append({"title": "Women Workers",
                       "message": "Women workers count exceeds total workers. Please correct.",
                       "status": "fail", "category": "social"})
    elif workers > 0:
        p = (wm / workers) * 100
        checks.append({"title": "Gender Diversity",
                       "message": f"{p:.1f}% women in workforce. {'Good diversity.' if p > 25 else 'Below 25% — most buyers flag this.'}",
                       "status": "pass" if p > 10 else "warn", "category": "social"})

    # ─── CHECK 13: Safety Records ───
    inc = n("safety_incidents")
    if workers >= 100 and inc == 0:
        checks.append({"title": "Safety Records",
                       "message": f"Zero incidents reported with {workers:.0f} workers. Statistically unusual — ensure all incidents (including minor) are counted.",
                       "status": "warn", "category": "social"})
    elif workers > 0:
        rate = (inc / workers) * 100
        checks.append({"title": "Safety Rate",
                       "message": f"{rate:.1f} incidents per 100 workers. {'Within normal range.' if rate < 5 else 'Elevated — review safety protocols.'}",
                       "status": "pass" if rate < 5 else "warn", "category": "social"})

    # ─── CHECK 14: ESI/PF Coverage ───
    ben = n("workers_with_benefits")
    if workers > 0 and ben > 0:
        if ben > workers:
            checks.append({"title": "ESI/PF",
                           "message": "Workers with benefits exceeds total workers. Please correct.",
                           "status": "fail", "category": "social"})
        else:
            pct = (ben / workers) * 100
            checks.append({"title": "ESI/PF Coverage",
                           "message": f"{pct:.0f}% of workers have ESI/PF. {'Compliant.' if pct >= 80 else 'Below mandatory threshold — legal risk.'}",
                           "status": "pass" if pct >= 80 else ("warn" if pct >= 50 else "fail"),
                           "category": "social"})

    # ─── CHECK 15: Wage Compliance ───
    w = n("wages_paid")
    if w > 0 and state:
        mw = STATE_MIN_WAGES.get(state, 340)
        ratio = w / mw
        if ratio >= 1.0:
            checks.append({"title": "Wage Compliance",
                           "message": f"Rs {w:.0f}/day is {ratio:.1f}x the state minimum of Rs {mw}/day. Compliant.",
                           "status": "pass", "category": "social"})
        else:
            checks.append({"title": "Wage Compliance",
                           "message": f"Rs {w:.0f}/day is BELOW the state minimum of Rs {mw}/day ({state}). This is a legal violation.",
                           "status": "fail", "category": "social"})

    # ─── CHECK 16: Safety Training ───
    training = n("training_hours")
    if workers > 0 and training == 0:
        checks.append({"title": "Safety Training",
                       "message": f"Zero safety training hours for {workers:.0f} workers. Indian Factories Act requires documented safety training. This is a compliance risk and will be flagged in buyer audits.",
                       "status": "warn", "category": "social"})

    # ─── CHECK 17: Statutory ESI/PF ───
    if workers >= 20 and ben > 0 and ben < workers:
        pct = (ben / workers) * 100
        if pct < 100:
            checks.append({"title": "Statutory ESI/PF Compliance",
                           "message": f"{workers:.0f} employees but only {ben:.0f} ({pct:.0f}%) have ESI/PF. With 20+ workers, ESI/PF is legally mandatory for ALL employees.",
                           "status": "fail", "category": "social"})

    return checks


def get_overall_confidence(checks):
    """Calculate overall data confidence from verification checks."""
    if not checks:
        return {"score": 50, "label": "Unknown", "color": "yellow"}

    p = sum(1 for c in checks if c["status"] == "pass")
    w = sum(1 for c in checks if c["status"] == "warn")
    f = sum(1 for c in checks if c["status"] == "fail")
    t = len(checks)

    score = int(((p * 100) + (w * 50)) / t) if t > 0 else 50

    if f >= 2 or score < 40:
        return {"score": score, "label": "Low Confidence", "color": "red"}
    elif w >= 3 or score < 70:
        return {"score": score, "label": "Medium Confidence", "color": "yellow"}
    else:
        return {"score": score, "label": "High Confidence", "color": "green"}
