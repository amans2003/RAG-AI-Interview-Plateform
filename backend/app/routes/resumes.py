"""
Resume API routes.
POST   /api/resumes/upload
GET    /api/resumes
GET    /api/resumes/{id}
DELETE /api/resumes/{id}
"""
from fastapi import APIRouter, Depends, UploadFile, File
from app.middleware.auth_middleware import get_current_user
from app.services.resume_service import upload_resume, get_resumes, get_resume, delete_resume
from app.utils.file_validation import validate_file, validate_file_size
from app.utils.response import success_response

router = APIRouter(prefix="/api/resumes", tags=["Resumes"])


@router.post("/upload", summary="Upload and process a resume (PDF, DOCX, TXT)")
async def upload(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    # Validate file type
    ext = validate_file(file)
    # Read and validate size
    file_bytes = await validate_file_size(file)

    result = await upload_resume(
        file_bytes=file_bytes,
        filename=file.filename,
        file_ext=ext,
        user_id=current_user["id"],
    )
    return success_response(data=result, message="Resume uploaded and processed successfully")


@router.get("", summary="List all resumes for the current user")
async def list_resumes(current_user: dict = Depends(get_current_user)):
    resumes = await get_resumes(current_user["id"])
    return success_response(data=resumes)


@router.get("/{resume_id}", summary="Get a specific resume by ID")
async def get_one(resume_id: str, current_user: dict = Depends(get_current_user)):
    resume = await get_resume(resume_id, current_user["id"])
    return success_response(data=resume)


@router.delete("/{resume_id}", summary="Delete a resume and all associated data")
async def delete(resume_id: str, current_user: dict = Depends(get_current_user)):
    await delete_resume(resume_id, current_user["id"])
    return success_response(message="Resume deleted successfully")
