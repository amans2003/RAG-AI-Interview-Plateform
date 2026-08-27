"""
Authentication API routes.
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
GET  /api/auth/stats
"""
from fastapi import APIRouter, Depends
from app.schemas.auth import RegisterRequest, LoginRequest
from app.services.auth_service import register_user, login_user, get_user_stats
from app.middleware.auth_middleware import get_current_user
from app.utils.response import success_response

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", summary="Register a new user account")
async def register(data: RegisterRequest):
    result = await register_user(data)
    return success_response(
        data={
            "access_token": result["token"],
            "token_type": "bearer",
            "user": result["user"],
        },
        message="Account created successfully"
    )


@router.post("/login", summary="Login with email and password")
async def login(data: LoginRequest):
    result = await login_user(data)
    return success_response(
        data={
            "access_token": result["token"],
            "token_type": "bearer",
            "user": result["user"],
        },
        message="Login successful"
    )


@router.get("/me", summary="Get current authenticated user")
async def get_me(current_user: dict = Depends(get_current_user)):
    return success_response(data=current_user)


@router.get("/stats", summary="Get user statistics")
async def get_stats(current_user: dict = Depends(get_current_user)):
    stats = await get_user_stats(current_user["id"])
    return success_response(data=stats)
