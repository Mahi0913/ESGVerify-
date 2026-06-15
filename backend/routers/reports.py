"""
Reports Router — PDF report generation.
Endpoints: POST /report/pdf
"""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from components.report_generator import (generate_pdf_report,
                                         generate_excel_report,
                                         generate_improvement_pdf)
from routers.deps import ReportRequest

router = APIRouter(prefix="/api/report", tags=["Reports"])


@router.post("/pdf")
async def api_generate_pdf(req: ReportRequest):
    """Generate a comprehensive BRSR Core ESG assessment PDF report.
    Includes: company info, 9 KPIs, verification results,
    fuzzy scores, gap analysis, and methodology notes.
    """
    buf, rid = generate_pdf_report(
        req.company_data, req.kpis, req.verification_checks,
        req.gap_analysis, req.suggestions_data, req.fuzzy_data)
    return StreamingResponse(
        buf, media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=ESGVerify_{rid}.pdf"})


@router.post("/excel")
async def api_generate_excel(req: ReportRequest):
    """Generate Excel report with KPIs, verification, and gap analysis sheets."""
    buf = generate_excel_report(
        req.company_data, req.kpis, req.verification_checks,
        req.gap_analysis, req.suggestions_data)
    return StreamingResponse(
        buf, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=ESGVerify_Data.xlsx"})


@router.post("/improvement")
async def api_generate_improvement(req: ReportRequest):
    """Generate improvement roadmap PDF with prioritized actions and cost estimates."""
    buf = generate_improvement_pdf(
        req.company_data, req.kpis, req.suggestions_data, req.gap_analysis)
    return StreamingResponse(
        buf, media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=ESGVerify_Improvement.pdf"})
