"""
Backend tests for authentication endpoints with deterministic mocks.
"""
import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_register_success():
    mock_result = {
        "token": "fake_jwt_token",
        "user": {
            "id": "507f1f77bcf86cd799439011",
            "name": "Test User",
            "email": "test_unique@example.com",
            "created_at": "2026-08-27T00:00:00",
        },
    }
    with patch("app.routes.auth.register_user", new=AsyncMock(return_value=mock_result)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/auth/register", json={
                "name": "Test User",
                "email": "test_unique@example.com",
                "password": "testpassword123",
            })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["access_token"] == "fake_jwt_token"


@pytest.mark.asyncio
async def test_register_weak_password():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/auth/register", json={
            "name": "Test",
            "email": "test@example.com",
            "password": "short",
        })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_invalid_credentials():
    from fastapi import HTTPException
    with patch("app.routes.auth.login_user", new=AsyncMock(side_effect=HTTPException(status_code=401, detail="Invalid credentials"))):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/auth/login", json={
                "email": "nonexistent@example.com",
                "password": "wrongpassword",
            })
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_without_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/auth/me")
    assert response.status_code in [401, 403]


@pytest.mark.asyncio
async def test_protected_route_invalid_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalidtoken"}
        )
    assert response.status_code == 401
