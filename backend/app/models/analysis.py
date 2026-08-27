"""
Analysis MongoDB model.
"""
from datetime import datetime
from app.config.database import get_database


class AnalysisModel:
    collection_name = "analyses"

    @staticmethod
    def get_collection():
        return get_database()[AnalysisModel.collection_name]

    @staticmethod
    def to_dict(doc: dict) -> dict:
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
