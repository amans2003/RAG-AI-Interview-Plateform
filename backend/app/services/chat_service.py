"""
Chat service — RAG-powered AI chat with conversation management.
"""
import logging
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from app.config.database import get_database
from app.ai.rag_pipeline import run_chat_rag

logger = logging.getLogger(__name__)


async def send_message(
    question: str,
    user_id: str,
    conversation_id: str = None,
    resume_id: str = None,
    job_id: str = None,
) -> dict:
    """
    Process a chat message through the RAG pipeline.
    Creates or continues a conversation.
    """
    db = get_database()

    # Create or fetch conversation
    if conversation_id:
        conv = await db.conversations.find_one({
            "_id": ObjectId(conversation_id),
            "user_id": ObjectId(user_id),
        })
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        conv_id = conversation_id
    else:
        # Create new conversation
        now = datetime.utcnow()
        title = question[:50] + "..." if len(question) > 50 else question
        conv_doc = {
            "user_id": ObjectId(user_id),
            "title": title,
            "resume_id": ObjectId(resume_id) if resume_id else None,
            "job_id": ObjectId(job_id) if job_id else None,
            "created_at": now,
            "updated_at": now,
        }
        result = await db.conversations.insert_one(conv_doc)
        conv_id = str(result.inserted_id)

    # Store user message
    now = datetime.utcnow()
    user_msg = {
        "conversation_id": ObjectId(conv_id),
        "role": "user",
        "content": question,
        "sources": [],
        "created_at": now,
    }
    await db.messages.insert_one(user_msg)

    # Run RAG pipeline
    try:
        answer, sources = await run_chat_rag(
            question=question,
            user_id=user_id,
            resume_id=resume_id,
            job_id=job_id,
        )
    except Exception as e:
        logger.error(f"RAG chat error: {e}")
        answer = "I'm having trouble processing your request right now. Please try again in a moment."
        sources = []

    # Store assistant message
    assistant_msg = {
        "conversation_id": ObjectId(conv_id),
        "role": "assistant",
        "content": answer,
        "sources": sources,
        "created_at": datetime.utcnow(),
    }
    msg_result = await db.messages.insert_one(assistant_msg)

    # Update conversation timestamp
    await db.conversations.update_one(
        {"_id": ObjectId(conv_id)},
        {"$set": {"updated_at": datetime.utcnow()}}
    )

    return {
        "answer": answer,
        "sources": sources,
        "conversation_id": conv_id,
        "message_id": str(msg_result.inserted_id),
    }


async def get_conversations(user_id: str) -> list:
    db = get_database()
    cursor = db.conversations.find({"user_id": ObjectId(user_id)}).sort("updated_at", -1)
    docs = await cursor.to_list(50)
    return [_serialize_conversation(d) for d in docs]


async def get_conversation_messages(conversation_id: str, user_id: str) -> list:
    db = get_database()
    # Verify ownership
    conv = await db.conversations.find_one({
        "_id": ObjectId(conversation_id),
        "user_id": ObjectId(user_id),
    })
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    cursor = db.messages.find({"conversation_id": ObjectId(conversation_id)}).sort("created_at", 1)
    docs = await cursor.to_list(200)
    return [_serialize_message(d) for d in docs]


def _serialize_conversation(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "user_id": str(doc.get("user_id", "")),
        "title": doc.get("title", "New Conversation"),
        "resume_id": str(doc["resume_id"]) if doc.get("resume_id") else None,
        "job_id": str(doc["job_id"]) if doc.get("job_id") else None,
        "created_at": doc.get("created_at", datetime.utcnow()).isoformat(),
        "updated_at": doc.get("updated_at", datetime.utcnow()).isoformat(),
    }


def _serialize_message(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "conversation_id": str(doc.get("conversation_id", "")),
        "role": doc.get("role", "user"),
        "content": doc.get("content", ""),
        "sources": doc.get("sources", []),
        "created_at": doc.get("created_at", datetime.utcnow()).isoformat(),
    }
