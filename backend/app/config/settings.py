"""
Application settings loaded from environment variables.
Uses pydantic-settings for type-safe configuration.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # Gemini AI
    gemini_api_key: str = ""

    # MongoDB
    mongodb_uri: str = "mongodb://localhost:27017"
    database_name: str = "ai_resume_platform"

    # JWT
    jwt_secret: str = "default_development_secret_key_change_in_production_123456"
    jwt_expire_minutes: int = 60
    jwt_algorithm: str = "HS256"

    # App
    frontend_url: str = "http://localhost:5173"
    max_upload_size_mb: int = 10
    upload_dir: str = "uploads"

    # Generation & Embedding Models
    generation_model: str = "gemini-2.5-flash"
    embedding_model: str = "models/gemini-embedding-001"
    embedding_dimension: int = 3072

    # RAG
    chunk_size: int = 800
    chunk_overlap: int = 100
    rag_top_k: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

