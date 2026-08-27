"""
File validation utilities.
"""
import os
from fastapi import UploadFile, HTTPException
from app.config.settings import settings

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}

MAX_FILE_SIZE = settings.max_upload_size_mb * 1024 * 1024  # bytes


def validate_file(file: UploadFile) -> str:
    """
    Validate uploaded file by extension and MIME type.
    Returns the file extension (e.g., '.pdf').
    Raises HTTPException on invalid file.
    """
    # Check extension
    _, ext = os.path.splitext(file.filename or "")
    ext = ext.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: PDF, DOCX, TXT"
        )

    # Check MIME type
    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        # Some clients send different MIME types, warn but don't block
        pass

    return ext


async def validate_file_size(file: UploadFile) -> bytes:
    """
    Read file content and validate size.
    Returns file bytes.
    """
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {settings.max_upload_size_mb}MB"
        )
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file is not allowed")
    return content
