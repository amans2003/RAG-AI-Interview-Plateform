"""
Analysis API routes.
POST /api/analysis
GET  /api/analysis
GET  /api/analysis/{id}
GET  /api/analysis/dashboard/stats
"""
from fastapi import APIRouter, Depends
from app.middleware.auth_middleware import get_current_user
from app.services.analysis_service import create_analysis, get_analyses, get_analysis, get_dashboard_stats
from app.schemas.analysis import AnalysisRequest
from app.utils.response import success_response

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])


@router.post("", summary="Analyze resume against job description using AI")
async def analyze(data: AnalysisRequest, current_user: dict = Depends(get_current_user)):
    result = await create_analysis(
        resume_id=data.resume_id,
        job_id=data.job_id,
        user_id=current_user["id"],
    )
    return success_response(data=result, message="Analysis complete")


@router.get("/dashboard/stats", summary="Get dashboard statistics")
async def dashboard(current_user: dict = Depends(get_current_user)):
    stats = await get_dashboard_stats(current_user["id"])
    return success_response(data=stats)


@router.get("", summary="List all analyses for the current user")
async def list_analyses(current_user: dict = Depends(get_current_user)):
    analyses = await get_analyses(current_user["id"])
    return success_response(data=analyses)


@router.get("/{analysis_id}", summary="Get a specific analysis by ID")
async def get_one(analysis_id: str, current_user: dict = Depends(get_current_user)):
    analysis = await get_analysis(analysis_id, current_user["id"])
    return success_response(data=analysis)
