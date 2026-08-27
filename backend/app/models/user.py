"""
User MongoDB model with helper methods.
"""
from datetime import datetime
from bson import ObjectId
from app.config.database import get_database


class UserModel:
    collection_name = "users"

    @staticmethod
    def get_collection():
        return get_database()[UserModel.collection_name]

    @staticmethod
    def to_dict(user_doc: dict) -> dict:
        """Convert MongoDB document to serializable dict."""
        if not user_doc:
            return None
        return {
            "id": str(user_doc["_id"]),
            "name": user_doc.get("name", ""),
            "email": user_doc.get("email", ""),
            "created_at": user_doc.get("created_at", datetime.utcnow()).isoformat(),
            "updated_at": user_doc.get("updated_at", datetime.utcnow()).isoformat(),
        }
