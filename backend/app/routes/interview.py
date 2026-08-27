"""
Interview question generation routes.
POST /api/interview/generate
GET  /api/interview
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.middleware.auth_middleware import get_current_user
from app.services.interview_service import generate_interview_questions, get_interviews
from app.utils.response import success_response

router = APIRouter(prefix="/api/interview", tags=["Interview"])


class InterviewRequest(BaseModel):
    resume_id: str
    job_id: str
    analysis_id: Optional[str] = None


@router.post("/generate", summary="Generate interview questions based on resume and job")
async def generate(data: InterviewRequest, current_user: dict = Depends(get_current_user)):
    result = await generate_interview_questions(
        resume_id=data.resume_id,
        job_id=data.job_id,
        user_id=current_user["id"],
        analysis_id=data.analysis_id,
    )
    return success_response(data=result, message="Interview questions generated successfully")


@router.get("", summary="List all interview sessions for the current user")
async def list_interviews(current_user: dict = Depends(get_current_user)):
    interviews = await get_interviews(current_user["id"])
    return success_response(data=interviews)
