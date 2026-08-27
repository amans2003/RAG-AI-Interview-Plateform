"""
Chat Pydantic schemas.
"""
from pydantic import BaseModel
from typing import List, Optional


class ChatRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None
    resume_id: Optional[str] = None
    job_id: Optional[str] = None


class SourceRef(BaseModel):
    document_type: str
    document_name: str
    section: str
    chunk_index: int


class ChatResponse(BaseModel):
    answer: str
    sources: List[dict] = []
    conversation_id: str
    message_id: str


class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    resume_id: Optional[str]
    job_id: Optional[str]
    created_at: str
    updated_at: str


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    sources: List[dict] = []
    created_at: str
