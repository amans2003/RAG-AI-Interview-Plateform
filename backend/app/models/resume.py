"""
Resume MongoDB model.
"""
from datetime import datetime
from bson import ObjectId
from app.config.database import get_database


class ResumeModel:
    collection_name = "resumes"

    @staticmethod
    def get_collection():
        return get_database()[ResumeModel.collection_name]

    @staticmethod
    def to_dict(doc: dict) -> dict:
        if not doc:
            return None
        return {
            "id": str(doc["_id"]),
            "user_id": str(doc.get("user_id", "")),
            "file_name": doc.get("file_name", ""),
            "file_type": doc.get("file_type", ""),
            "file_path": doc.get("file_path", ""),
            "raw_text": doc.get("raw_text", ""),
            "parsed_data": doc.get("parsed_data", {}),
            "embedding_status": doc.get("embedding_status", "pending"),
            "created_at": doc.get("created_at", datetime.utcnow()).isoformat(),
        }
