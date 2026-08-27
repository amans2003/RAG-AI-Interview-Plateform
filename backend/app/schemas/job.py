"""
Job Pydantic schemas.
"""
from pydantic import BaseModel
from typing import Optional, List


class JobCreateRequest(BaseModel):
    company: str
    title: str
    description: str
    requirements: List[str] = []
    skills: List[str] = []
    experience_required: Optional[str] = ""


class JobUpdateRequest(BaseModel):
    company: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    experience_required: Optional[str] = None


class JobResponse(BaseModel):
    id: str
    user_id: str
    company: str
    title: str
    description: str
    requirements: List[str]
    skills: List[str]
    experience_required: str
    embedding_status: str
    created_at: str
    updated_at: str
