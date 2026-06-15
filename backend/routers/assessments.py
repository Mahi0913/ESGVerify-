"""
Assessments Router — create, read, update assessments + audit trail.
All endpoints require authentication.
Endpoints: POST/GET /assessments, GET/PUT /assessments/{id}, GET /assessments/{id}/audit
"""

from fastapi import APIRouter, HTTPException, Depends

from database import (create_assessment, update_assessment, get_assessment,
                      get_user_assessments, get_latest_assessment,
                      log_action, get_audit_log)
from routers.deps import UpdateAssessmentRequest, get_current_user

router = APIRouter(prefix="/api/assessments", tags=["Assessments"])


@router.post("")
async def create_new_assessment(user=Depends(get_current_user)):
    """Create a new assessment for the logged-in user."""
    assessment_id = create_assessment(user["id"])
    return {"assessment_id": assessment_id, "message": "Assessment created"}


@router.get("")
async def list_assessments(user=Depends(get_current_user)):
    """Get all assessments for the logged-in user."""
    assessments = get_user_assessments(user["id"])
    return {"assessments": assessments}


@router.get("/latest")
async def get_latest(user=Depends(get_current_user)):
    """Get the latest in-progress assessment (for resume feature)."""
    latest = get_latest_assessment(user["id"])
    if latest:
        return {"assessment": latest, "has_incomplete": True}
    return {"assessment": None, "has_incomplete": False}


@router.get("/{assessment_id}")
async def get_single_assessment(assessment_id: int, user=Depends(get_current_user)):
    """Get a single assessment with all data."""
    assessment = get_assessment(assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    if assessment["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not your assessment")
    return {"assessment": assessment}


@router.put("/{assessment_id}")
async def update_single_assessment(assessment_id: int, req: UpdateAssessmentRequest, user=Depends(get_current_user)):
    """Update assessment data (auto-save from frontend)."""
    assessment = get_assessment(assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    if assessment["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not your assessment")

    update_data = {}
    # Build update dict from non-None fields
    field_map = {
        "step": "current_step",
        "company_data": "company_data",
        "answers": "answers",
        "buyer_search": "buyer_search",
        "buyer_summary": "buyer_summary",
        "questions": "questions",
        "verification_checks": "verification_checks",
        "kpis": "kpis",
        "fuzzy_data": "fuzzy_data",
        "gap_analysis": "gap_analysis",
        "suggestions": "suggestions",
        "overall_score": "overall_score",
        "greenwash_risk": "greenwash_risk",
        "data_confidence": "data_confidence",
        "status": "status",
    }
    for req_field, db_field in field_map.items():
        value = getattr(req, req_field, None)
        if value is not None:
            update_data[db_field] = value

    if update_data:
        update_assessment(assessment_id, **update_data)

    return {"message": "Assessment updated"}


@router.get("/{assessment_id}/audit")
async def get_assessment_audit(assessment_id: int, user=Depends(get_current_user)):
    """Get audit trail for an assessment."""
    assessment = get_assessment(assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    if assessment["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not your assessment")
    log = get_audit_log(assessment_id)
    return {"audit_log": log}


@router.post("/{assessment_id}/log")
async def add_audit_log(assessment_id: int, action: str, details: str = "", user=Depends(get_current_user)):
    """Add an entry to the audit trail."""
    log_action(assessment_id, user["id"], action, details)
    return {"message": "Logged"}
