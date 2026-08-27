"""
Analysis service — RAG-powered resume vs job analysis using Gemini.
"""
import logging
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from app.config.database import get_database
from app.schemas.analysis import AnalysisResult
from app.ai.rag_pipeline import run_analysis_rag

logger = logging.getLogger(__name__)


async def create_analysis(resume_id: str, job_id: str, user_id: str) -> dict:
    """
    Run full RAG analysis pipeline and store results.
    1. Retrieve resume and job chunks via RAG
    2. Generate structured analysis with Gemini
    3. Validate with Pydantic
    4. Store and return
    """
    db = get_database()

    # Verify ownership of resume and job
    resume_doc = await db.resumes.find_one({
        "_id": ObjectId(resume_id),
        "user_id": ObjectId(user_id),
    })
    if not resume_doc:
        raise HTTPException(status_code=404, detail="Resume not found or access denied")

    job_doc = await db.jobs.find_one({
        "_id": ObjectId(job_id),
        "user_id": ObjectId(user_id),
    })
    if not job_doc:
        raise HTTPException(status_code=404, detail="Job not found or access denied")

    # Run RAG analysis
    try:
        raw_result = await run_analysis_rag(
            resume_id=resume_id,
            job_id=job_id,
            user_id=user_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=f"AI analysis failed: {str(e)}")

    # Validate AI response with Pydantic — never trust raw AI JSON
    try:
        validated = AnalysisResult(**raw_result)
    except Exception as e:
        logger.error(f"Analysis validation failed: {e}. Raw: {raw_result}")
        raise HTTPException(status_code=500, detail="AI returned an invalid analysis format. Please try again.")

    now = datetime.utcnow()
    analysis_doc = {
        "user_id": ObjectId(user_id),
        "resume_id": ObjectId(resume_id),
        "job_id": ObjectId(job_id),
        "match_score": validated.match_score,
        "summary": validated.summary,
        "matching_skills": validated.matching_skills,
        "missing_skills": validated.missing_skills,
        "partial_skills": validated.partial_skills,
        "experience_analysis": validated.experience_analysis,
        "project_analysis": validated.project_analysis,
        "ats_keywords_present": validated.ats_keywords_present,
        "ats_keywords_missing": validated.ats_keywords_missing,
        "recommendations": validated.recommendations,
        "resume_name": resume_doc.get("file_name", ""),
        "job_title": f"{job_doc.get('title', '')} at {job_doc.get('company', '')}",
        "created_at": now,
    }

    result = await db.analyses.insert_one(analysis_doc)
    analysis_doc["_id"] = result.inserted_id
    return _serialize_analysis(analysis_doc)


async def get_analyses(user_id: str) -> list:
    db = get_database()
    cursor = db.analyses.find({"user_id": ObjectId(user_id)}).sort("created_at", -1)
    docs = await cursor.to_list(50)
    return [_serialize_analysis(d) for d in docs]


async def get_analysis(analysis_id: str, user_id: str) -> dict:
    db = get_database()
    try:
        doc = await db.analyses.find_one({
            "_id": ObjectId(analysis_id),
            "user_id": ObjectId(user_id),
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid analysis ID")

    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return _serialize_analysis(doc)


async def get_dashboard_stats(user_id: str) -> dict:
    """Aggregate stats for dashboard."""
    db = get_database()
    uid = ObjectId(user_id)

    resumes_count = await db.resumes.count_documents({"user_id": uid})
    jobs_count = await db.jobs.count_documents({"user_id": uid})
    analyses_count = await db.analyses.count_documents({"user_id": uid})

    # Average score
    pipeline = [
        {"$match": {"user_id": uid}},
        {"$group": {"_id": None, "avg": {"$avg": "$match_score"}}}
    ]
    avg_result = await db.analyses.aggregate(pipeline).to_list(1)
    avg_score = round(avg_result[0]["avg"]) if avg_result else 0

    # Recent analyses
    recent_cursor = db.analyses.find({"user_id": uid}).sort("created_at", -1).limit(5)
    recent_analyses = await recent_cursor.to_list(5)

    # Top skills from resumes
    top_skills = []
    resume_cursor = db.resumes.find({"user_id": uid}).limit(5)
    resumes = await resume_cursor.to_list(5)
    skill_counts = {}
    for r in resumes:
        for skill in r.get("parsed_data", {}).get("skills", []):
            skill_counts[skill] = skill_counts.get(skill, 0) + 1
    top_skills = sorted(skill_counts.keys(), key=lambda x: -skill_counts[x])[:10]

    # Missing skills from analyses
    missing_skills = {}
    analysis_cursor = db.analyses.find({"user_id": uid}).limit(10)
    analyses_docs = await analysis_cursor.to_list(10)
    for a in analyses_docs:
        for skill in a.get("missing_skills", []):
            missing_skills[skill] = missing_skills.get(skill, 0) + 1
    top_missing = sorted(missing_skills.keys(), key=lambda x: -missing_skills[x])[:8]

    return {
        "resumes_count": resumes_count,
        "jobs_count": jobs_count,
        "analyses_count": analyses_count,
        "avg_match_score": avg_score,
        "recent_analyses": [_serialize_analysis(a) for a in recent_analyses],
        "top_skills": top_skills,
        "missing_skills": top_missing,
    }


def _serialize_analysis(doc: dict) -> dict:
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "user_id": str(doc.get("user_id", "")),
        "resume_id": str(doc.get("resume_id", "")),
        "job_id": str(doc.get("job_id", "")),
        "match_score": doc.get("match_score", 0),
        "summary": doc.get("summary", ""),
        "matching_skills": doc.get("matching_skills", []),
        "missing_skills": doc.get("missing_skills", []),
        "partial_skills": doc.get("partial_skills", []),
        "experience_analysis": doc.get("experience_analysis", ""),
        "project_analysis": doc.get("project_analysis", ""),
        "ats_keywords_present": doc.get("ats_keywords_present", []),
        "ats_keywords_missing": doc.get("ats_keywords_missing", []),
        "recommendations": doc.get("recommendations", []),
        "resume_name": doc.get("resume_name", ""),
        "job_title": doc.get("job_title", ""),
        "created_at": doc.get("created_at", datetime.utcnow()).isoformat(),
    }
