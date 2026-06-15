"""
Shared dependencies — auth helper and request/response models.
Imported by all routers so models are defined once, not repeated.
"""

from fastapi import HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from auth import decode_token
from database import get_user_by_id


# ─── AUTH DEPENDENCY ───
# Used as: user = Depends(get_current_user) in any protected endpoint

async def get_current_user(authorization: Optional[str] = Header(None)):
    """Extract and validate user from JWT token in Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = get_user_by_id(payload["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ═══════════════════════════════════════════════════════
# REQUEST MODELS — grouped by router
# ═══════════════════════════════════════════════════════

# Auth
class SignupRequest(BaseModel):
    email: str
    name: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

# Validation
class GSTINRequest(BaseModel):
    gstin: str

class CityStateRequest(BaseModel):
    city: str
    state: str

class GSTINStateRequest(BaseModel):
    gstin: str
    state: str

# Buyer search
class BuyerSearchRequest(BaseModel):
    buyer_name: str
    industry: Optional[str] = None

# Questions
class QuestionRequest(BaseModel):
    industry: str
    buyer_name: str
    buyer_requirements_text: str

# Calculation
class KPIRequest(BaseModel):
    data: Dict[str, Any]

class VerifyRequest(BaseModel):
    data: Dict[str, Any]

class FuzzyRequest(BaseModel):
    checks: List[Dict[str, Any]]
    kpis: List[Dict[str, Any]]
    company_data: Dict[str, Any]

# Analysis
class GapRequest(BaseModel):
    kpis: List[Dict[str, Any]]
    buyer_name: str
    buyer_search_results: List[Dict[str, Any]]
    company_data: Optional[Dict[str, Any]] = None

class SuggestionRequest(BaseModel):
    kpis: List[Dict[str, Any]]
    gap_analysis: Optional[Dict[str, Any]] = None
    company_data: Dict[str, Any]
    buyer_name: str
    govt_schemes_results: Optional[List[Dict[str, Any]]] = None

class ExpansionRequest(BaseModel):
    current_gaps: Optional[Dict[str, Any]] = None
    new_buyer: str
    kpis: List[Dict[str, Any]]
    company_data: Optional[Dict[str, Any]] = None
    industry: Optional[str] = None

# Reports
class ReportRequest(BaseModel):
    company_data: Dict[str, Any]
    kpis: List[Dict[str, Any]]
    verification_checks: List[Dict[str, Any]]
    gap_analysis: Optional[Dict[str, Any]] = None
    suggestions_data: Optional[Dict[str, Any]] = None
    fuzzy_data: Optional[Dict[str, Any]] = None

# Assessment update
class UpdateAssessmentRequest(BaseModel):
    step: Optional[int] = None
    company_data: Optional[Dict[str, Any]] = None
    answers: Optional[Dict[str, Any]] = None
    buyer_search: Optional[List[Dict[str, Any]]] = None
    buyer_summary: Optional[Dict[str, Any]] = None
    questions: Optional[List[Dict[str, Any]]] = None
    verification_checks: Optional[List[Dict[str, Any]]] = None
    kpis: Optional[List[Dict[str, Any]]] = None
    fuzzy_data: Optional[Dict[str, Any]] = None
    gap_analysis: Optional[Dict[str, Any]] = None
    suggestions: Optional[Dict[str, Any]] = None
    overall_score: Optional[float] = None
    greenwash_risk: Optional[float] = None
    data_confidence: Optional[float] = None
    status: Optional[str] = None

# Help bot
class HelpBotRequest(BaseModel):
    question: str
