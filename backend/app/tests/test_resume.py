"""
Tests for resume upload validation.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_upload_without_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/resumes/upload")
    assert response.status_code in [401, 403, 422]


@pytest.mark.asyncio
async def test_upload_with_invalid_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/resumes/upload",
            headers={"Authorization": "Bearer invalidtoken"},
        )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_resumes_without_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/resumes")
    assert response.status_code in [401, 403]

