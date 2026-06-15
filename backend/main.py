"""
ESGVerify Backend 
==========================
Automated ESG Compliance Platform for Indian MSMEs.

Architecture:
    main.py          — App creation, CORS, static data, health check
    routers/
        auth_router  — Signup, login, JWT token management
        assessments  — CRUD for assessments + audit trail
        calculation  — 9 KPI calculation, 17 verification checks, fuzzy scoring
        analysis     — Buyer search, gap analysis, AI suggestions, help bot
        reports      — PDF and Excel report generation
    components/      — Core business logic (calculator, fuzzy_scorer, verifier, etc.)
    utils/           — AI client (Groq/Gemini/OpenAI), web search (Serper)

Regulatory Sources:
    - CEA CO2 Baseline Database v19 (grid emission factor: 0.82 kg CO2/kWh)
    - IPCC 2006 Guidelines (fuel emission factors)
    - Bureau of Energy Efficiency (energy conversion: 0.0036 GJ/kWh)
    - Ministry of Labour (state minimum wages, 22 states)
    - Indian Factories Act 1948 (standard hours: 2400/worker/year)
    - SEBI BRSR Core 2023 (9 KPI framework)
"""

from routers.reports import router as reports_router
from routers.analysis import router as analysis_router
from routers.calculation import router as calculation_router
from routers.assessments import router as assessments_router
from routers.auth_router import router as auth_router
import os
import sys
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure project root is on path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

# ─── CREATE APP ───
app = FastAPI(
    title="ESGVerify API",
    version="4.0",
    description="AI-powered BRSR Core ESG compliance platform for Indian MSMEs",
)

# ─── CORS ───
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── REGISTER ROUTERS ───

app.include_router(auth_router)
app.include_router(assessments_router)
app.include_router(calculation_router)
app.include_router(analysis_router)
app.include_router(reports_router)


# ═══════════════════════════════════════════════════════
# STATIC DATA & HEALTH — kept in main.py (simple, no logic)
# ═══════════════════════════════════════════════════════

@app.get("/api/health", tags=["System"])
async def health():
    """Health check — confirms all modules are loaded."""
    return {
        "status": "ok",
        "version": "4.0",
        "modules": "all loaded",
        "auth": "enabled",
        "routers": ["auth", "assessments", "calculation", "analysis", "reports"],
    }


@app.get("/api/industries", tags=["Static Data"])
async def get_industries():
    """List of 20 supported MSME industry sectors."""
    return {"industries": [
        "Textiles & Garments", "Food Processing", "Auto Components",
        "Chemicals & Pharma", "Leather & Footwear", "Plastics & Rubber",
        "Metal Fabrication", "Metal Casting", "Electronics Assembly",
        "Paper & Packaging", "Construction Materials", "Handicrafts & Artisan",
        "Agro & Rural Industry", "IT & Software Services",
        "Education & Training", "Healthcare & Diagnostics",
        "Hospitality & Food Service", "Logistics & Warehousing",
        "Professional Services", "Other Manufacturing",
    ]}


@app.get("/api/states", tags=["Static Data"])
async def get_states():
    """List of 22 Indian states with minimum wage data."""
    return {"states": [
        "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa",
        "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
        "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab",
        "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh",
        "Uttarakhand", "West Bengal",
    ]}


@app.get("/api/buyers", tags=["Static Data"])
async def get_buyers():
    """List of 20 common target buyers for Indian MSMEs."""
    return {"buyers": [
        "Tata Group", "Reliance Industries", "H&M", "Nike", "Apple",
        "IKEA", "Zara/Inditex", "Walmart", "Amazon", "Adidas",
        "Tesla", "Decathlon", "Bosch", "Samsung", "Toyota",
        "Hyundai", "Mahindra", "L&T", "Infosys", "Wipro",
    ]}


@app.get("/api/settings/regulatory", tags=["Static Data"])
async def get_regulatory_settings():
    """All regulatory values used in ESG calculations.
    Sourced from official Indian and international regulatory bodies.
    Displayed on the Settings page for transparency.
    """
    from components.calculator import GRID_EF, FUEL_FACTORS, STATE_MIN_WAGES, KWH_TO_GJ, STD_HOURS
    return {
        "cea_grid_factor": {
            "value": GRID_EF, "unit": "kg CO2/kWh",
            "source": "CEA CO2 Baseline Database v19",
        },
        "kwh_to_gj": {
            "value": KWH_TO_GJ, "unit": "GJ/kWh",
            "source": "Bureau of Energy Efficiency (BEE)",
        },
        "std_hours": {
            "value": STD_HOURS, "unit": "hours/worker/year",
            "source": "Indian Factories Act 1948",
        },
        "fuel_factors": {
            name: {**data, "source": "IPCC 2006 Guidelines"}
            for name, data in FUEL_FACTORS.items()
        },
        "state_min_wages": {
            state: {"value": wage, "unit": "Rs/day",
                    "source": "Ministry of Labour 2024-25"}
            for state, wage in STATE_MIN_WAGES.items()
        },
    }


# ─── RUN ───
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
