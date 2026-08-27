"""
Conversation and Message MongoDB models.
"""
from datetime import datetime
from app.config.database import get_database


class ConversationModel:
    collection_name = "conversations"

    @staticmethod
    def get_collection():
        return get_database()[ConversationModel.collection_name]

    @staticmethod
    def to_dict(doc: dict) -> dict:
        if not doc:
            return None
        return {
            "id": str(doc["_id"]),
            "user_id": str(doc.get("user_id", "")),
            "title": doc.get("title", "New Conversation"),
            "resume_id": str(doc["resume_id"]) if doc.get("resume_id") else None,
            "job_id": str(doc["job_id"]) if doc.get("job_id") else None,
            "created_at": doc.get("created_at", datetime.utcnow()).isoformat(),
            "updated_at": doc.get("updated_at", datetime.utcnow()).isoformat(),
        }


class MessageModel:
    collection_name = "messages"

    @staticmethod
    def get_collection():
        return get_database()[MessageModel.collection_name]

    @staticmethod
    def to_dict(doc: dict) -> dict:
        if not doc:
            return None
        return {
            "id": str(doc["_id"]),
            "conversation_id": str(doc.get("conversation_id", "")),
            "role": doc.get("role", "user"),  # user | assistant
            "content": doc.get("content", ""),
            "sources": doc.get("sources", []),
            "created_at": doc.get("created_at", datetime.utcnow()).isoformat(),
        }
