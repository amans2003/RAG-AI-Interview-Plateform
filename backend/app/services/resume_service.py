"""
Resume service — handles upload, parse, embed, store, and delete.
"""
import os
import uuid
import logging
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, UploadFile
from app.config.database import get_database
from app.config.settings import settings
from app.document_processing.parser_factory import extract_text, clean_text
from app.ai.gemini_client import generate_structured_response
from app.ai.prompts import get_resume_parser_prompt
from app.ai.embeddings import generate_embedding
from app.rag.chunker import chunk_text
from app.rag.vector_search import store_chunks, delete_chunks_by_document

logger = logging.getLogger(__name__)


async def upload_resume(file_bytes: bytes, filename: str, file_ext: str, user_id: str) -> dict:
    """
    Full resume processing pipeline:
    1. Save file
    2. Extract text
    3. Parse with Gemini
    4. Chunk
    5. Generate embeddings
    6. Store everything
    """
    db = get_database()

    # Save file to disk
    upload_dir = settings.upload_dir
    os.makedirs(upload_dir, exist_ok=True)
    safe_name = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, safe_name)

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Extract text
    try:
        raw_text = extract_text(file_bytes, file_ext)
        raw_text = clean_text(raw_text)
    except ValueError as e:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail=str(e))

    if not raw_text or len(raw_text) < 50:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="Could not extract meaningful text from the file.")

    # Parse resume structure with Gemini
    try:
        prompt = get_resume_parser_prompt(raw_text[:4000])  # limit text for parsing
        parsed_data = await generate_structured_response(prompt, temperature=0.1)
    except Exception as e:
        logger.warning(f"Resume parsing failed: {e}. Using empty parsed data.")
        parsed_data = {
            "name": "", "email": "", "phone": "", "summary": "",
            "skills": [], "experience": [], "education": [], "projects": []
        }

    now = datetime.utcnow()
    resume_doc = {
        "user_id": ObjectId(user_id),
        "file_name": filename,
        "file_type": file_ext.lstrip("."),
        "file_path": file_path,
        "raw_text": raw_text,
        "parsed_data": parsed_data,
        "embedding_status": "processing",
        "created_at": now,
    }

    result = await db.resumes.insert_one(resume_doc)
    resume_id = str(result.inserted_id)

    # Chunk the text
    chunks = chunk_text(
        text=raw_text,
        document_id=resume_id,
        document_type="resume",
        user_id=user_id,
        source_name=filename,
    )

    # Generate embeddings for each chunk
    try:
        for chunk in chunks:
            chunk["embedding"] = await generate_embedding(chunk["text"])

        await store_chunks(chunks)

        # Update embedding status
        await db.resumes.update_one(
            {"_id": ObjectId(resume_id)},
            {"$set": {"embedding_status": "ready"}}
        )
    except Exception as e:
        logger.error(f"Embedding generation failed for resume {resume_id}: {e}")
        await db.resumes.update_one(
            {"_id": ObjectId(resume_id)},
            {"$set": {"embedding_status": "failed"}}
        )

    # Return final document
    doc = await db.resumes.find_one({"_id": ObjectId(resume_id)})
    return _serialize_resume(doc)


async def get_resumes(user_id: str) -> list:
    """Get all resumes for a user."""
    db = get_database()
    cursor = db.resumes.find({"user_id": ObjectId(user_id)}).sort("created_at", -1)
    docs = await cursor.to_list(100)
    return [_serialize_resume_list(d) for d in docs]


async def get_resume(resume_id: str, user_id: str) -> dict:
    """Get a single resume, enforcing user ownership."""
    db = get_database()
    try:
        doc = await db.resumes.find_one({
            "_id": ObjectId(resume_id),
            "user_id": ObjectId(user_id),
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid resume ID")

    if not doc:
        raise HTTPException(status_code=404, detail="Resume not found")
    return _serialize_resume(doc)


async def delete_resume(resume_id: str, user_id: str) -> bool:
    """
    Delete resume and all associated data:
    - Resume document
    - Document chunks
    - File from disk
    """
    db = get_database()

    # Verify ownership
    doc = await db.resumes.find_one({
        "_id": ObjectId(resume_id),
        "user_id": ObjectId(user_id),
    })
    if not doc:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Delete chunks
    deleted_chunks = await delete_chunks_by_document(resume_id, user_id)
    logger.info(f"Deleted {deleted_chunks} chunks for resume {resume_id}")

    # Delete file from disk
    file_path = doc.get("file_path", "")
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            logger.warning(f"Could not delete file {file_path}: {e}")

    # Delete resume document
    await db.resumes.delete_one({"_id": ObjectId(resume_id)})

    # Optionally delete related analyses
    await db.analyses.delete_many({
        "resume_id": ObjectId(resume_id),
        "user_id": ObjectId(user_id),
    })

    return True


def _serialize_resume(doc: dict) -> dict:
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "user_id": str(doc.get("user_id", "")),
        "file_name": doc.get("file_name", ""),
        "file_type": doc.get("file_type", ""),
        "raw_text": doc.get("raw_text", ""),
        "parsed_data": doc.get("parsed_data", {}),
        "embedding_status": doc.get("embedding_status", "pending"),
        "created_at": doc.get("created_at", datetime.utcnow()).isoformat(),
    }


def _serialize_resume_list(doc: dict) -> dict:
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "user_id": str(doc.get("user_id", "")),
        "file_name": doc.get("file_name", ""),
        "file_type": doc.get("file_type", ""),
        "embedding_status": doc.get("embedding_status", "pending"),
        "created_at": doc.get("created_at", datetime.utcnow()).isoformat(),
        "parsed_data": doc.get("parsed_data", {}),
    }
