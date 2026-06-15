"""
Question Engine — ALWAYS uses standard 27 questions (correct field keys for calculator).
AI adds BONUS questions specific to buyer/industry ON TOP of the standard set.
This guarantees all 9 KPIs always calculate correctly.
"""
from utils.ai_client import ai_json

SECTOR_PRODUCTION_UNITS = {
    "Textiles & Garments": ["Pieces/Units", "Kg", "Metres", "Sq. Metres"], "Food Processing": ["Kg", "Tonnes", "Litres", "Packets"],
    "Auto Components": ["Pieces/Units", "Kg", "Tonnes"], "Chemicals & Pharma": ["Kg", "Tonnes", "Litres"],
    "Leather & Footwear": ["Pairs", "Sq. Metres", "Pieces/Units"], "Plastics & Rubber": ["Kg", "Tonnes", "Pieces/Units"],
    "Metal Fabrication": ["Kg", "Tonnes", "Pieces/Units"], "Metal Casting": ["Kg", "Tonnes", "Pieces/Units"],
    "Electronics Assembly": ["Pieces/Units", "Boards", "Modules"], "Paper & Packaging": ["Kg", "Tonnes", "Reams"],
    "Construction Materials": ["Tonnes", "Cubic Metres", "Pieces/Units"], "Handicrafts & Artisan": ["Pieces/Units", "Kg"],
    "Agro & Rural Industry": ["Kg", "Tonnes", "Quintals"],
    "IT & Software Services": ["Projects Delivered", "Billable Hours", "Revenue (Rs Lakhs)"],
    "Education & Training": ["Students Enrolled", "Courses Delivered", "Revenue (Rs Lakhs)"],
    "Healthcare & Diagnostics": ["Patients Served", "Tests Conducted", "Revenue (Rs Lakhs)"],
    "Hospitality & Food Service": ["Guests Served", "Meals Served", "Revenue (Rs Lakhs)"],
    "Logistics & Warehousing": ["Shipments Handled", "Tonnes Moved", "Revenue (Rs Lakhs)"],
    "Professional Services": ["Projects Delivered", "Billable Hours", "Revenue (Rs Lakhs)"],
    "Other Manufacturing": ["Pieces/Units", "Kg", "Tonnes"],
}


def generate_dynamic_questions(industry, buyer_name, buyer_requirements_text, existing_data=None):
    """
    Returns: standard 27 questions + AI bonus questions.
    Standard questions have EXACT field_key names that calculator.py expects.
    AI bonus questions are extra, specific to buyer/industry.
    """
    # ALWAYS start with the 27 standard questions — these NEVER change
    standard = _get_standard_questions(industry)
    print(f"[QuestionEngine] Standard questions: {len(standard)}")

    # Try to get AI bonus questions (3-6 extra)
    bonus = []
    try:
        bonus = _get_ai_bonus_questions(
            industry, buyer_name, buyer_requirements_text)
        if not isinstance(bonus, list):
            bonus = []
        # Safety: if AI returned more than 10, it probably generated a full set — discard
        if len(bonus) > 10:
            print(
                f"[QuestionEngine] AI returned {len(bonus)} bonus questions — too many, discarding")
            bonus = []
        print(f"[QuestionEngine] Bonus questions: {len(bonus)}")
    except Exception as e:
        print(f"[QuestionEngine] Bonus question error: {e}")
        bonus = []

    # Combine: standard ALWAYS first, bonus appended
    all_questions = standard + bonus
    print(f"[QuestionEngine] Total questions: {len(all_questions)}")
    return all_questions


def _get_ai_bonus_questions(industry, buyer_name, buyer_requirements_text):
    """AI generates 3-6 EXTRA questions specific to this buyer/industry."""
    prompt = f"""You are an ESG expert. A "{industry}" MSME is targeting buyer "{buyer_name}".

Buyer requirements from web search:
{buyer_requirements_text}

The MSME will already answer standard questions about electricity, fuel, water, waste, workers, safety, wages, complaints, and production.

Generate 3-6 ADDITIONAL questions that are SPECIFIC to "{buyer_name}" and "{industry}" that the standard set does NOT cover. Examples:
- Chemical management (for textiles/H&M)
- Conflict minerals (for electronics/Apple)
- Supply chain traceability (for luxury brands)
- Carbon offset programs (for tech companies)
- Child labor audits (for garment exporters)

Rules: Plain English, no jargon, no emoji. Indian context. All money in Rs.

Respond ONLY with a JSON array. Each item: {{"id":"bonus_1","question":"text","helper":"where to find answer","field_key":"bonus_field_name","input_type":"number or select or text","unit":"unit or null","options":["opt1"] or null,"required":false,"category":"buyer_specific","brsr_kpi":"Buyer Requirement"}}"""

    try:
        result = ai_json(prompt, max_tokens=1500)
        if result and isinstance(result, list):
            validated = []
            for q in result:
                validated.append({
                    "id": q.get("id", f"bonus_{len(validated)}"),
                    "question": q.get("question", ""),
                    "helper": q.get("helper", ""),
                    "field_key": q.get("field_key", f"bonus_{len(validated)}"),
                    "input_type": q.get("input_type", "text"),
                    "unit": q.get("unit"),
                    "options": q.get("options"),
                    "required": False,
                    "category": "buyer_specific",
                    "brsr_kpi": q.get("brsr_kpi", "Buyer Requirement"),
                })
            return validated
    except Exception as e:
        print(f"AI bonus questions failed: {e}")

    return []


def _get_standard_questions(industry):
    """
    27 standard questions with EXACT field_key names matching calculator.py.
    These NEVER change — guarantees all 9 KPIs always calculate.
    """
    pu = SECTOR_PRODUCTION_UNITS.get(
        industry, ["Pieces/Units", "Kg", "Tonnes"])

    return [
        # ─── ENERGY (6 fuel types + electricity + solar) ───
        {"id": "e1", "question": "How many electricity units does your facility use per month?",
         "helper": "Check your monthly EB bill — look for 'Units Consumed'",
         "field_key": "electricity_units", "input_type": "number", "unit": "kWh/month",
         "options": None, "required": True, "category": "energy", "brsr_kpi": "GHG + Energy Intensity"},

        {"id": "e2", "question": "What is your monthly electricity bill amount?",
         "helper": "Total amount on your EB bill (helps cross-verify units)",
         "field_key": "electricity_bill", "input_type": "number", "unit": "Rs/month",
         "options": None, "required": False, "category": "energy", "brsr_kpi": "Energy Intensity"},

        {"id": "e3a", "question": "Diesel used per month? (Enter 0 if not used)",
         "helper": "Generators, transport vehicles, machinery",
         "field_key": "fuel_diesel", "input_type": "number", "unit": "litres/month",
         "options": None, "required": False, "category": "energy", "brsr_kpi": "GHG Footprint"},

        {"id": "e3b", "question": "Petrol used per month? (Enter 0 if not used)",
         "helper": "Vehicles, small equipment",
         "field_key": "fuel_petrol", "input_type": "number", "unit": "litres/month",
         "options": None, "required": False, "category": "energy", "brsr_kpi": "GHG Footprint"},

        {"id": "e3c", "question": "LPG used per month? (Enter 0 if not used)",
         "helper": "Heating, cooking, industrial process",
         "field_key": "fuel_lpg", "input_type": "number", "unit": "kg/month",
         "options": None, "required": False, "category": "energy", "brsr_kpi": "GHG Footprint"},

        {"id": "e3d", "question": "Coal used per month? (Enter 0 if not used)",
         "helper": "Boilers, furnaces",
         "field_key": "fuel_coal", "input_type": "number", "unit": "kg/month",
         "options": None, "required": False, "category": "energy", "brsr_kpi": "GHG Footprint"},

        {"id": "e3e", "question": "Furnace Oil used per month? (Enter 0 if not used)",
         "helper": "Industrial heating, boilers",
         "field_key": "fuel_furnaceoil", "input_type": "number", "unit": "litres/month",
         "options": None, "required": False, "category": "energy", "brsr_kpi": "GHG Footprint"},

        {"id": "e3f", "question": "Natural Gas used per month? (Enter 0 if not used)",
         "helper": "Piped natural gas, CNG",
         "field_key": "fuel_natgas", "input_type": "number", "unit": "m3/month",
         "options": None, "required": False, "category": "energy", "brsr_kpi": "GHG Footprint"},

        {"id": "e5", "question": "Solar or renewable energy generated per month?",
         "helper": "If you have solar panels. Enter 0 if none.",
         "field_key": "renewable_units", "input_type": "number", "unit": "kWh/month",
         "options": None, "required": False, "category": "energy", "brsr_kpi": "Energy Intensity"},

        # ─── WATER ───
        {"id": "w1", "question": "How much water does your facility use per day?",
         "helper": "All sources combined: borewell, tanker, municipal. Estimate: tank size x fills per day",
         "field_key": "water_daily_litres", "input_type": "number", "unit": "litres/day",
         "options": None, "required": True, "category": "water", "brsr_kpi": "Water Footprint"},

        {"id": "w2", "question": "What is your main water source?",
         "helper": "Select primary source of water",
         "field_key": "water_source", "input_type": "select", "unit": None,
         "options": ["Borewell", "Municipal/Corporation", "Tanker", "River/Lake", "Rainwater Harvesting", "Multiple Sources"],
         "required": True, "category": "water", "brsr_kpi": "Water Footprint"},

        {"id": "w3", "question": "How much water do you recycle or reuse daily? (Enter 0 if none)",
         "helper": "ETP/STP output, reuse for gardening, cooling etc.",
         "field_key": "water_recycled_daily", "input_type": "number", "unit": "litres/day",
         "options": None, "required": False, "category": "water", "brsr_kpi": "Water Footprint"},

        # ─── WASTE ───
        {"id": "ws1", "question": "Non-hazardous waste produced per month in kg?",
         "helper": "Packaging, fabric scraps, food waste, paper, plastic, general waste",
         "field_key": "waste_nonhaz_kg", "input_type": "number", "unit": "kg/month",
         "options": None, "required": True, "category": "waste", "brsr_kpi": "Waste Management + Circularity"},

        {"id": "ws2", "question": "Hazardous waste produced per month in kg? (Enter 0 if none)",
         "helper": "Chemical waste, used oil, batteries, e-waste, ETP sludge",
         "field_key": "waste_haz_kg", "input_type": "number", "unit": "kg/month",
         "options": None, "required": False, "category": "waste", "brsr_kpi": "Waste Management"},

        {"id": "ws3", "question": "How do you dispose of your waste?",
         "helper": "Select the main disposal method",
         "field_key": "waste_disposal", "input_type": "select", "unit": None,
         "options": ["Authorized Recycler (with certificate)", "Recycler/Scrap dealer", "Municipal pickup", "Landfill", "Incineration", "Composting", "Multiple methods"],
         "required": True, "category": "waste", "brsr_kpi": "Waste Management"},

        {"id": "ws4", "question": "Total raw material input per month in kg?",
         "helper": "Fabric, steel, chemicals, food ingredients — total raw material purchased. Enter 0 for service sector.",
         "field_key": "raw_material_kg", "input_type": "number", "unit": "kg/month",
         "options": None, "required": False, "category": "waste", "brsr_kpi": "Circularity"},

        # ─── SOCIAL ───
        {"id": "s1", "question": "Total number of workers in your organization?",
         "helper": "Count everyone: permanent + contract + daily wage",
         "field_key": "workers", "input_type": "number", "unit": "people",
         "options": None, "required": True, "category": "social", "brsr_kpi": "Multiple KPIs"},

        {"id": "s2", "question": "How many women work in your organization?",
         "helper": "All women: permanent, contract, daily wage",
         "field_key": "women_workers", "input_type": "number", "unit": "people",
         "options": None, "required": True, "category": "social", "brsr_kpi": "Gender Diversity"},

        {"id": "s3", "question": "How many work injuries occurred in the last 12 months?",
         "helper": "Count all injuries including minor ones (cuts, falls, burns). Enter 0 if none.",
         "field_key": "safety_incidents", "input_type": "number", "unit": "incidents",
         "options": None, "required": True, "category": "social", "brsr_kpi": "Occupational Safety"},

        {"id": "s4", "question": "How many workdays were lost due to injuries?",
         "helper": "Total days workers could not work due to injuries. Enter 0 if none.",
         "field_key": "lost_workdays", "input_type": "number", "unit": "days",
         "options": None, "required": False, "category": "social", "brsr_kpi": "Occupational Safety"},

        {"id": "s5", "question": "How many workers are registered with ESI and PF?",
         "helper": "Employee State Insurance + Provident Fund registered count",
         "field_key": "workers_with_benefits", "input_type": "number", "unit": "people",
         "options": None, "required": True, "category": "social", "brsr_kpi": "Wage Parity"},

        {"id": "s6", "question": "What is the lowest daily wage paid to any worker? (in Rs)",
         "helper": "The minimum daily wage in your organization",
         "field_key": "wages_paid", "input_type": "number", "unit": "Rs/day",
         "options": None, "required": True, "category": "social", "brsr_kpi": "Wage Parity"},

        {"id": "s7", "question": "Total safety training hours conducted in last 12 months?",
         "helper": "All training sessions combined across all workers. Enter 0 if none.",
         "field_key": "training_hours", "input_type": "number", "unit": "hours/year",
         "options": None, "required": False, "category": "social", "brsr_kpi": "Occupational Safety"},

        # ─── GOVERNANCE ───
        {"id": "g1", "question": "How many customer complaints did you receive in the last 12 months?",
         "helper": "Quality complaints, delivery issues, any formal complaints. Enter 0 if none.",
         "field_key": "complaints_total", "input_type": "number", "unit": "complaints",
         "options": None, "required": True, "category": "governance", "brsr_kpi": "Governance Complaints"},

        {"id": "g2", "question": "How many of those complaints were resolved?",
         "helper": "Complaints that were addressed and closed",
         "field_key": "complaints_resolved", "input_type": "number", "unit": "resolved",
         "options": None, "required": True, "category": "governance", "brsr_kpi": "Governance Complaints"},

        # ─── PRODUCTION ───
        {"id": "p1", "question": "What is your average monthly output/production quantity?",
         "helper": "How much you produce or deliver per month",
         "field_key": "production_qty", "input_type": "number", "unit": "per month",
         "options": None, "required": True, "category": "production", "brsr_kpi": "Intensity Calculations"},

        {"id": "p2", "question": "How do you measure your output?",
         "helper": "Select the unit that matches your industry",
         "field_key": "production_unit", "input_type": "select", "unit": None,
         "options": pu, "required": True, "category": "production", "brsr_kpi": "Intensity Calculations"},
    ]
