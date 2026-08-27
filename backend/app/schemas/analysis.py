"""
Analysis Pydantic schemas.
"""
from pydantic import BaseModel, field_validator
from typing import List, Optional


class AnalysisRequest(BaseModel):
    resume_id: str
    job_id: str


class AnalysisResult(BaseModel):
    """
    Validated structure of the Gemini analysis response.
    Used for safe parsing of AI-generated JSON.
    """
    match_score: int
    summary: str
    matching_skills: List[str] = []
    missing_skills: List[str] = []
    partial_skills: List[str] = []
    experience_analysis: str = ""
    project_analysis: str = ""
    ats_keywords_present: List[str] = []
    ats_keywords_missing: List[str] = []
    recommendations: List[str] = []

    @field_validator("match_score")
    @classmethod
    def score_range(cls, v):
        return max(0, min(100, v))


class AnalysisResponse(BaseModel):
    id: str
    user_id: str
    resume_id: str
    job_id: str
    match_score: int
    summary: str
    matching_skills: List[str]
    missing_skills: List[str]
    partial_skills: List[str]
    experience_analysis: str
    project_analysis: str
    ats_keywords_present: List[str]
    ats_keywords_missing: List[str]
    recommendations: List[str]
    resume_name: str
    job_title: str
    created_at: str
