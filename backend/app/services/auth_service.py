"""
Authentication service: register, login, get current user stats.
"""
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status
from app.config.database import get_database
from app.utils.security import hash_password, verify_password, create_access_token
from app.schemas.auth import RegisterRequest, LoginRequest
import logging

logger = logging.getLogger(__name__)


async def register_user(data: RegisterRequest) -> dict:
    """Register a new user. Raises 409 if email already exists."""
    db = get_database()

    # Check email uniqueness
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists"
        )

    now = datetime.utcnow()
    user_doc = {
        "name": data.name.strip(),
        "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "created_at": now,
        "updated_at": now,
    }

    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = create_access_token({"sub": str(result.inserted_id)})
    return {
        "token": token,
        "user": {
            "id": str(result.inserted_id),
            "name": user_doc["name"],
            "email": user_doc["email"],
            "created_at": now.isoformat(),
        }
    }


async def login_user(data: LoginRequest) -> dict:
    """Authenticate user and return JWT."""
    db = get_database()

    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token({"sub": str(user["_id"])})
    return {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "created_at": user.get("created_at", datetime.utcnow()).isoformat(),
        }
    }


async def get_user_stats(user_id: str) -> dict:
    """Get user account stats for dashboard/profile."""
    db = get_database()
    uid = ObjectId(user_id)

    resumes_count = await db.resumes.count_documents({"user_id": uid})
    jobs_count = await db.jobs.count_documents({"user_id": uid})
    analyses_count = await db.analyses.count_documents({"user_id": uid})

    # Average match score
    pipeline = [
        {"$match": {"user_id": uid}},
        {"$group": {"_id": None, "avg_score": {"$avg": "$match_score"}}}
    ]
    avg_result = await db.analyses.aggregate(pipeline).to_list(1)
    avg_score = round(avg_result[0]["avg_score"]) if avg_result else 0

    return {
        "resumes_count": resumes_count,
        "jobs_count": jobs_count,
        "analyses_count": analyses_count,
        "avg_match_score": avg_score,
    }
