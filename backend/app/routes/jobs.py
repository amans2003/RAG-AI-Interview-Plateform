"""
Jobs API routes — full CRUD.
POST   /api/jobs
GET    /api/jobs
GET    /api/jobs/{id}
PUT    /api/jobs/{id}
DELETE /api/jobs/{id}
"""
from fastapi import APIRouter, Depends
from app.middleware.auth_middleware import get_current_user
from app.services.job_service import create_job, get_jobs, get_job, update_job, delete_job
from app.schemas.job import JobCreateRequest, JobUpdateRequest
from app.utils.response import success_response

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


@router.post("", summary="Create a new job description")
async def create(data: JobCreateRequest, current_user: dict = Depends(get_current_user)):
    job = await create_job(data, current_user["id"])
    return success_response(data=job, message="Job created successfully")


@router.get("", summary="List all jobs for the current user")
async def list_jobs(current_user: dict = Depends(get_current_user)):
    jobs = await get_jobs(current_user["id"])
    return success_response(data=jobs)


@router.get("/{job_id}", summary="Get a specific job by ID")
async def get_one(job_id: str, current_user: dict = Depends(get_current_user)):
    job = await get_job(job_id, current_user["id"])
    return success_response(data=job)


@router.put("/{job_id}", summary="Update a job description")
async def update(job_id: str, data: JobUpdateRequest, current_user: dict = Depends(get_current_user)):
    job = await update_job(job_id, data, current_user["id"])
    return success_response(data=job, message="Job updated successfully")


@router.delete("/{job_id}", summary="Delete a job and its associated data")
async def delete(job_id: str, current_user: dict = Depends(get_current_user)):
    await delete_job(job_id, current_user["id"])
    return success_response(message="Job deleted successfully")
