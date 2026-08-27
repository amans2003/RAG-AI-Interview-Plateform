"""
Chat API routes.
POST /api/chat
GET  /api/chat/conversations
GET  /api/chat/conversations/{id}
"""
from fastapi import APIRouter, Depends
from app.middleware.auth_middleware import get_current_user
from app.services.chat_service import send_message, get_conversations, get_conversation_messages
from app.schemas.chat import ChatRequest
from app.utils.response import success_response

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("", summary="Send a message and get an AI response via RAG")
async def chat(data: ChatRequest, current_user: dict = Depends(get_current_user)):
    result = await send_message(
        question=data.question,
        user_id=current_user["id"],
        conversation_id=data.conversation_id,
        resume_id=data.resume_id,
        job_id=data.job_id,
    )
    return success_response(data=result)


@router.get("/conversations", summary="List all conversations for current user")
async def list_conversations(current_user: dict = Depends(get_current_user)):
    conversations = await get_conversations(current_user["id"])
    return success_response(data=conversations)


@router.get("/conversations/{conversation_id}", summary="Get messages in a conversation")
async def get_messages(conversation_id: str, current_user: dict = Depends(get_current_user)):
    messages = await get_conversation_messages(conversation_id, current_user["id"])
    return success_response(data=messages)
