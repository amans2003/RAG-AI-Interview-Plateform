"""
Resume Pydantic schemas.
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ParsedData(BaseModel):
    name: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    summary: Optional[str] = ""
    skills: List[str] = []
    experience: List[dict] = []
    education: List[dict] = []
    projects: List[dict] = []


class ResumeResponse(BaseModel):
    id: str
    user_id: str
    file_name: str
    file_type: str
    raw_text: str
    parsed_data: dict
    embedding_status: str
    created_at: str


class ResumeListResponse(BaseModel):
    id: str
    user_id: str
    file_name: str
    file_type: str
    embedding_status: str
    created_at: str
    parsed_data: dict
