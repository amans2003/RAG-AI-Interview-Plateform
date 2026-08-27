"""
Interview question generation service.
"""
import logging
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from app.config.database import get_database
from app.ai.rag_pipeline import run_interview_rag

logger = logging.getLogger(__name__)


async def generate_interview_questions(
    resume_id: str,
    job_id: str,
    user_id: str,
    analysis_id: str = None,
) -> dict:
    """Generate interview questions and store them."""
    db = get_database()

    # Verify ownership
    resume_doc = await db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": ObjectId(user_id)})
    if not resume_doc:
        raise HTTPException(status_code=404, detail="Resume not found")

    job_doc = await db.jobs.find_one({"_id": ObjectId(job_id), "user_id": ObjectId(user_id)})
    if not job_doc:
        raise HTTPException(status_code=404, detail="Job not found")

    # Get missing/matching skills from latest analysis if available
    missing_skills = []
    matching_skills = []
    if analysis_id:
        analysis = await db.analyses.find_one({"_id": ObjectId(analysis_id), "user_id": ObjectId(user_id)})
        if analysis:
            missing_skills = analysis.get("missing_skills", [])
            matching_skills = analysis.get("matching_skills", [])
    else:
        # Try to find the latest analysis for this resume+job
        latest = await db.analyses.find_one(
            {"resume_id": ObjectId(resume_id), "job_id": ObjectId(job_id), "user_id": ObjectId(user_id)},
            sort=[("created_at", -1)]
        )
        if latest:
            missing_skills = latest.get("missing_skills", [])
            matching_skills = latest.get("matching_skills", [])

    try:
        questions = await run_interview_rag(
            resume_id=resume_id,
            job_id=job_id,
            user_id=user_id,
            missing_skills=missing_skills,
            matching_skills=matching_skills,
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Interview generation failed: {str(e)}")

    now = datetime.utcnow()
    interview_doc = {
        "user_id": ObjectId(user_id),
        "resume_id": ObjectId(resume_id),
        "job_id": ObjectId(job_id),
        "analysis_id": ObjectId(analysis_id) if analysis_id else None,
        "questions": questions,
        "resume_name": resume_doc.get("file_name", ""),
        "job_title": f"{job_doc.get('title', '')} at {job_doc.get('company', '')}",
        "created_at": now,
    }

    result = await db.interviews.insert_one(interview_doc)

    return {
        "id": str(result.inserted_id),
        "user_id": user_id,
        "resume_id": resume_id,
        "job_id": job_id,
        "questions": questions,
        "resume_name": interview_doc["resume_name"],
        "job_title": interview_doc["job_title"],
        "created_at": now.isoformat(),
    }


async def get_interviews(user_id: str) -> list:
    db = get_database()
    cursor = db.interviews.find({"user_id": ObjectId(user_id)}).sort("created_at", -1)
    docs = await cursor.to_list(50)
    return [
        {
            "id": str(d["_id"]),
            "user_id": str(d.get("user_id", "")),
            "resume_name": d.get("resume_name", ""),
            "job_title": d.get("job_title", ""),
            "question_count": len(d.get("questions", [])),
            "created_at": d.get("created_at", datetime.utcnow()).isoformat(),
        }
        for d in docs
    ]
