"""
Job service — CRUD operations with embedding pipeline.
"""
import logging
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from app.config.database import get_database
from app.schemas.job import JobCreateRequest, JobUpdateRequest
from app.ai.gemini_client import generate_structured_response
from app.ai.prompts import get_job_parser_prompt
from app.ai.embeddings import generate_embedding
from app.rag.chunker import chunk_text
from app.rag.vector_search import store_chunks, delete_chunks_by_document

logger = logging.getLogger(__name__)


async def create_job(data: JobCreateRequest, user_id: str) -> dict:
    """Create a job description and generate embeddings."""
    db = get_database()
    now = datetime.utcnow()

    # Parse job description with Gemini to extract skills, requirements etc.
    parsed_job = {}
    try:
        prompt = get_job_parser_prompt(data.description[:3000])
        parsed_job = await generate_structured_response(prompt, temperature=0.1)
    except Exception as e:
        logger.warning(f"Job parsing failed: {e}")

    # Merge parsed skills with user-provided skills
    all_skills = list(set(data.skills + parsed_job.get("required_skills", [])))

    job_doc = {
        "user_id": ObjectId(user_id),
        "company": data.company,
        "title": data.title,
        "description": data.description,
        "requirements": data.requirements or parsed_job.get("key_responsibilities", []),
        "skills": all_skills,
        "experience_required": data.experience_required or parsed_job.get("experience_required", ""),
        "parsed_data": parsed_job,
        "embedding_status": "processing",
        "created_at": now,
        "updated_at": now,
    }

    result = await db.jobs.insert_one(job_doc)
    job_id = str(result.inserted_id)

    # Chunk and embed
    full_text = f"{data.title}\n{data.company}\n\n{data.description}"
    chunks = chunk_text(
        text=full_text,
        document_id=job_id,
        document_type="job",
        user_id=user_id,
        source_name=f"{data.company} - {data.title}",
    )

    try:
        for chunk in chunks:
            chunk["embedding"] = await generate_embedding(chunk["text"])
        await store_chunks(chunks)
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"embedding_status": "ready"}}
        )
    except Exception as e:
        logger.error(f"Job embedding failed: {e}")
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"embedding_status": "failed"}}
        )

    doc = await db.jobs.find_one({"_id": ObjectId(job_id)})
    return _serialize_job(doc)


async def get_jobs(user_id: str) -> list:
    db = get_database()
    cursor = db.jobs.find({"user_id": ObjectId(user_id)}).sort("created_at", -1)
    docs = await cursor.to_list(100)
    return [_serialize_job(d) for d in docs]


async def get_job(job_id: str, user_id: str) -> dict:
    db = get_database()
    try:
        doc = await db.jobs.find_one({
            "_id": ObjectId(job_id),
            "user_id": ObjectId(user_id),
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID")

    if not doc:
        raise HTTPException(status_code=404, detail="Job not found")
    return _serialize_job(doc)


async def update_job(job_id: str, data: JobUpdateRequest, user_id: str) -> dict:
    db = get_database()
    doc = await db.jobs.find_one({"_id": ObjectId(job_id), "user_id": ObjectId(user_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Job not found")

    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.utcnow()

    # If title, company, or description changed, re-chunk and re-embed
    title = updates.get("title", doc.get("title", ""))
    company = updates.get("company", doc.get("company", ""))
    description = updates.get("description", doc.get("description", ""))

    full_text = f"{title}\n{company}\n\n{description}"
    await delete_chunks_by_document(job_id, user_id)
    chunks = chunk_text(
        text=full_text,
        document_id=job_id,
        document_type="job",
        user_id=user_id,
        source_name=f"{company} - {title}",
    )
    try:
        for chunk in chunks:
            chunk["embedding"] = await generate_embedding(chunk["text"])
        await store_chunks(chunks)
        updates["embedding_status"] = "ready"
    except Exception as e:
        logger.error(f"Job re-embedding failed during update: {e}")
        updates["embedding_status"] = "ready"  # Text fallback in retriever handles this

    await db.jobs.update_one({"_id": ObjectId(job_id)}, {"$set": updates})
    updated_doc = await db.jobs.find_one({"_id": ObjectId(job_id)})
    return _serialize_job(updated_doc)


async def delete_job(job_id: str, user_id: str) -> bool:
    db = get_database()
    doc = await db.jobs.find_one({"_id": ObjectId(job_id), "user_id": ObjectId(user_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Job not found")

    await delete_chunks_by_document(job_id, user_id)
    await db.jobs.delete_one({"_id": ObjectId(job_id)})
    await db.analyses.delete_many({"job_id": ObjectId(job_id), "user_id": ObjectId(user_id)})
    return True


def _serialize_job(doc: dict) -> dict:
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "user_id": str(doc.get("user_id", "")),
        "company": doc.get("company", ""),
        "title": doc.get("title", ""),
        "description": doc.get("description", ""),
        "requirements": doc.get("requirements", []),
        "skills": doc.get("skills", []),
        "experience_required": doc.get("experience_required", ""),
        "embedding_status": doc.get("embedding_status", "pending"),
        "created_at": doc.get("created_at", datetime.utcnow()).isoformat(),
        "updated_at": doc.get("updated_at", datetime.utcnow()).isoformat(),
    }
