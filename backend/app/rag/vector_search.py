"""
MongoDB Atlas Vector Search integration with in-memory Cosine Similarity fallback.
Performs semantic similarity search on document chunks.
User data isolation is strictly enforced via user_id filter.
"""
import math
import logging
from typing import List, Optional
from bson import ObjectId
from app.config.database import get_database
from app.config.settings import settings

logger = logging.getLogger(__name__)

# The name of the Atlas Vector Search index (if created in Atlas UI)
VECTOR_INDEX_NAME = "document_chunks_vector_index"


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Calculate cosine similarity between two float vectors."""
    if not vec_a or not vec_b:
        return 0.0
    dot = sum(x * y for x, y in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(x * x for x in vec_a))
    norm_b = math.sqrt(sum(x * x for x in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


async def vector_search(
    query_embedding: List[float],
    user_id: str,
    top_k: int = None,
    document_id: Optional[str] = None,
    document_type: Optional[str] = None,
) -> List[dict]:
    """
    Perform Vector Search on document_chunks.
    1. Tries MongoDB Atlas native $vectorSearch aggregation.
    2. If $vectorSearch returns empty (e.g. index not yet created in Atlas UI),
       computes exact Cosine Similarity across the user's chunk vectors in memory.
    3. If no chunks exist, falls back to raw document text.
    """
    if top_k is None:
        top_k = settings.rag_top_k

    db = get_database()

    # Try native Atlas $vectorSearch first
    try:
        user_oid = ObjectId(user_id)
        pre_filter = {"user_id": {"$eq": user_oid}}
        if document_id:
            try:
                pre_filter["document_id"] = {"$eq": ObjectId(document_id)}
            except Exception:
                pre_filter["document_id"] = {"$eq": document_id}
        if document_type:
            pre_filter["document_type"] = {"$eq": document_type}

        pipeline = [
            {
                "$vectorSearch": {
                    "index": VECTOR_INDEX_NAME,
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": top_k * 10,
                    "limit": top_k,
                    "filter": pre_filter,
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "text": 1,
                    "metadata": 1,
                    "document_id": 1,
                    "document_type": 1,
                    "chunk_index": 1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            }
        ]

        results = await db.document_chunks.aggregate(pipeline).to_list(top_k)
        if results:
            logger.info(f"Atlas native vector search returned {len(results)} chunks")
            return results
    except Exception as e:
        logger.warning(f"Native Atlas vectorSearch unavailable ({e}), using in-memory cosine ranking")

    # In-memory Cosine Similarity across user's chunks
    return await _in_memory_vector_search(db, query_embedding, user_id, top_k, document_id, document_type)


async def _in_memory_vector_search(
    db,
    query_embedding: List[float],
    user_id: str,
    top_k: int,
    document_id: Optional[str],
    document_type: Optional[str],
) -> List[dict]:
    """
    Query user's chunks from MongoDB and rank them by Cosine Similarity in Python.
    """
    query = {"$or": [{"user_id": ObjectId(user_id)}, {"user_id": str(user_id)}]}
    if document_id:
        try:
            doc_oid = ObjectId(document_id)
            query = {"$and": [query, {"$or": [{"document_id": doc_oid}, {"document_id": str(document_id)}]}]}
        except Exception:
            query = {"$and": [query, {"document_id": str(document_id)}]}
    if document_type:
        query = {"$and": [query, {"document_type": document_type}]}

    cursor = db.document_chunks.find(query)
    chunks = await cursor.to_list(200)

    if chunks:
        # Score each chunk by cosine similarity
        scored_chunks = []
        for c in chunks:
            emb = c.get("embedding")
            if emb:
                score = cosine_similarity(query_embedding, emb)
            else:
                score = 0.5
            c["score"] = score
            scored_chunks.append(c)

        # Sort descending by score
        scored_chunks.sort(key=lambda x: x.get("score", 0), reverse=True)
        logger.info(f"In-memory cosine ranking retrieved {len(scored_chunks[:top_k])} chunks")
        return scored_chunks[:top_k]

    # Fallback to raw resume/job collections if chunks are empty
    fallback_chunks = []
    if not document_type or document_type == "resume":
        resume_query = {"$or": [{"user_id": ObjectId(user_id)}, {"user_id": str(user_id)}]}
        if document_id:
            try:
                resume_query["_id"] = ObjectId(document_id)
            except Exception:
                resume_query["_id"] = document_id
        resumes = await db.resumes.find(resume_query).sort("created_at", -1).to_list(top_k)
        for r in resumes:
            text = r.get("raw_text", "")
            if not text and r.get("parsed_data"):
                text = str(r.get("parsed_data"))
            if text:
                fallback_chunks.append({
                    "_id": str(r["_id"]),
                    "text": text[:3000],
                    "document_id": str(r["_id"]),
                    "document_type": "resume",
                    "chunk_index": 0,
                    "metadata": {
                        "source_name": r.get("file_name", "Resume"),
                        "section": "summary",
                        "skills": r.get("parsed_data", {}).get("skills", []),
                    },
                })

    if not document_type or document_type == "job":
        job_query = {"$or": [{"user_id": ObjectId(user_id)}, {"user_id": str(user_id)}]}
        if document_id:
            try:
                job_query["_id"] = ObjectId(document_id)
            except Exception:
                job_query["_id"] = document_id
        jobs = await db.jobs.find(job_query).sort("created_at", -1).to_list(top_k)
        for j in jobs:
            text = f"{j.get('title', '')}\n{j.get('company', '')}\n{j.get('description', '')}"
            fallback_chunks.append({
                "_id": str(j["_id"]),
                "text": text[:3000],
                "document_id": str(j["_id"]),
                "document_type": "job",
                "chunk_index": 0,
                "metadata": {
                    "source_name": f"{j.get('company', '')} - {j.get('title', '')}",
                    "section": "job_description",
                    "skills": j.get("skills", []),
                },
            })

    return fallback_chunks[:top_k]


async def store_chunks(chunks: List[dict]) -> List[str]:
    """Store document chunks with embeddings in MongoDB."""
    if not chunks:
        return []

    db = get_database()
    processed_chunks = []
    for chunk in chunks:
        c = chunk.copy()
        c["user_id"] = ObjectId(c["user_id"])
        c["document_id"] = ObjectId(c["document_id"])
        processed_chunks.append(c)

    result = await db.document_chunks.insert_many(processed_chunks)
    return [str(oid) for oid in result.inserted_ids]


async def delete_chunks_by_document(document_id: str, user_id: str) -> int:
    """Delete all chunks for a document. Enforces user ownership."""
    db = get_database()
    result = await db.document_chunks.delete_many({
        "document_id": ObjectId(document_id),
        "user_id": ObjectId(user_id),
    })
    return result.deleted_count
