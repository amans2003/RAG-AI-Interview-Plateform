"""
RAG Retriever — converts a question to embedding and retrieves relevant chunks.
"""
import logging
from typing import List, Optional
from app.ai.embeddings import generate_query_embedding
from app.rag.vector_search import vector_search

logger = logging.getLogger(__name__)


async def retrieve_relevant_chunks(
    question: str,
    user_id: str,
    top_k: int = 5,
    document_id: Optional[str] = None,
    document_type: Optional[str] = None,
) -> List[dict]:
    """
    Full retrieval pipeline:
    1. Embed the question
    2. Search MongoDB Atlas Vector Search
    3. Return top-k relevant chunks
    
    SECURITY: user_id is always passed to enforce data isolation.
    """
    try:
        # Step 1: Embed the query
        query_embedding = await generate_query_embedding(question)

        # Step 2: Search
        chunks = await vector_search(
            query_embedding=query_embedding,
            user_id=user_id,
            top_k=top_k,
            document_id=document_id,
            document_type=document_type,
        )

        logger.info(f"Retrieved {len(chunks)} chunks for query: {question[:50]}...")
        return chunks

    except Exception as e:
        logger.error(f"Retrieval error: {e}")
        return []


async def retrieve_all_chunks_for_document(
    document_id: str,
    user_id: str,
    document_type: Optional[str] = None,
) -> List[dict]:
    """
    Retrieve ALL chunks for a specific document.
    Supports ObjectId and str, with fallback to source document content.
    """
    from app.config.database import get_database
    from bson import ObjectId

    db = get_database()

    doc_oid = ObjectId(document_id) if ObjectId.is_valid(document_id) else None
    user_oid = ObjectId(user_id) if ObjectId.is_valid(user_id) else None

    # Query matching either ObjectId or str representations
    doc_match = [{"document_id": doc_oid}, {"document_id": str(document_id)}] if doc_oid else [{"document_id": str(document_id)}]
    user_match = [{"user_id": user_oid}, {"user_id": str(user_id)}] if user_oid else [{"user_id": str(user_id)}]

    query = {
        "$and": [
            {"$or": doc_match},
            {"$or": user_match},
        ]
    }
    if document_type:
        query["document_type"] = document_type

    cursor = db.document_chunks.find(query).sort("chunk_index", 1)
    chunks = await cursor.to_list(200)

    # Fallback: if no chunks in document_chunks collection, build fallback chunk from source document
    if not chunks:
        if document_type == "resume" or not document_type:
            r_query = {"_id": doc_oid} if doc_oid else {"_id": document_id}
            if user_oid:
                r_query["user_id"] = user_oid
            resume_doc = await db.resumes.find_one(r_query)
            if resume_doc and resume_doc.get("raw_text"):
                chunks.append({
                    "text": resume_doc["raw_text"],
                    "metadata": {"source": resume_doc.get("file_name", "Resume"), "section": "resume_content"},
                })

        if (document_type == "job" or not document_type) and not chunks:
            j_query = {"_id": doc_oid} if doc_oid else {"_id": document_id}
            if user_oid:
                j_query["user_id"] = user_oid
            job_doc = await db.jobs.find_one(j_query)
            if job_doc:
                skills_str = ", ".join(job_doc.get("skills", []))
                text = f"Title: {job_doc.get('title', '')}\nCompany: {job_doc.get('company', '')}\nDescription:\n{job_doc.get('description', '')}\nSkills: {skills_str}"
                chunks.append({
                    "text": text,
                    "metadata": {"source": f"{job_doc.get('company')} - {job_doc.get('title')}", "section": "job_description"},
                })

    return chunks
