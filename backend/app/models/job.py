"""
Job MongoDB model.
"""
from datetime import datetime
from app.config.database import get_database


class JobModel:
    collection_name = "jobs"

    @staticmethod
    def get_collection():
        return get_database()[JobModel.collection_name]

    @staticmethod
    def to_dict(doc: dict) -> dict:
        if not doc:
            return None
        return {
            "id": str(doc["_id"]),
            "user_id": str(doc.get("user_id", "")),
            "company": doc.get("company", ""),
            "title": doc.get("title", ""),
            "description": doc.get("description", ""),
            "requirements": doc.get("requirements", []),
            "skills": doc.get("skills", []),
            "experience_required": doc.get("experience_required", ""),
            "embedding_status": doc.get("embedding_status", "pending"),
            "created_at": doc.get("created_at", datetime.utcnow()).isoformat(),
            "updated_at": doc.get("updated_at", datetime.utcnow()).isoformat(),
        }
