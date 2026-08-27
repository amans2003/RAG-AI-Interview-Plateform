"""
MongoDB Atlas Vector Search integration.
Performs semantic similarity search on document chunks.
User data isolation is enforced via user_id filter.
"""
import logging
from typing import List, Optional
from bson import ObjectId
from app.config.database import get_database
from app.config.settings import settings

logger = logging.getLogger(__name__)

# The name of the Atlas Vector Search index — must be created in Atlas UI
VECTOR_INDEX_NAME = "document_chunks_vector_index"


async def vector_search(
    query_embedding: List[float],
    user_id: str,
    top_k: int = None,
    document_id: Optional[str] = None,
    document_type: Optional[str] = None,
) -> List[dict]:
    """
    Perform MongoDB Atlas Vector Search on document_chunks.
    
    SECURITY: Always filters by user_id to prevent cross-user data access.
    
    Args:
        query_embedding: Embedding vector of the search query
        user_id: Current user's ID (REQUIRED for security)
        top_k: Number of results to return
        document_id: Optional filter by specific document
        document_type: Optional filter by 'resume' or 'job'
    
    Returns:
        List of matching chunk documents
    """
    if top_k is None:
        top_k = settings.rag_top_k

    db = get_database()

    # Build pre-filter for security and optional filters
    pre_filter = {"user_id": {"$eq": ObjectId(user_id)}}
    if document_id:
        pre_filter["document_id"] = {"$eq": ObjectId(document_id)}
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

    try:
        results = await db.document_chunks.aggregate(pipeline).to_list(top_k)
        logger.info(f"Vector search returned {len(results)} chunks for user {user_id}")
        return results
    except Exception as e:
        logger.error(f"Vector search error: {e}")
        # If vector search index doesn't exist yet, fallback to text search
        return await _fallback_text_search(db, user_id, top_k, document_id, document_type)


async def _fallback_text_search(
    db,
    user_id: str,
    top_k: int,
    document_id: Optional[str],
    document_type: Optional[str],
) -> List[dict]:
    """
    Fallback text search when vector index is not configured.
    Returns most recent chunks for the user.
    """
    logger.warning("Using fallback text search — configure MongoDB Atlas Vector Search index")
    query = {"user_id": ObjectId(user_id)}
    if document_id:
        query["document_id"] = ObjectId(document_id)
    if document_type:
        query["document_type"] = document_type

    cursor = db.document_chunks.find(query).limit(top_k)
    return await cursor.to_list(top_k)


async def store_chunks(chunks: List[dict]) -> List[str]:
    """
    Store document chunks with embeddings in MongoDB.
    
    Args:
        chunks: List of chunk dicts with embedding field populated
    
    Returns:
        List of inserted document IDs
    """
    if not chunks:
        return []

    db = get_database()

    # Convert user_id and document_id to ObjectId for storage
    processed_chunks = []
    for chunk in chunks:
        c = chunk.copy()
        c["user_id"] = ObjectId(c["user_id"])
        c["document_id"] = ObjectId(c["document_id"])
        processed_chunks.append(c)

    result = await db.document_chunks.insert_many(processed_chunks)
    return [str(oid) for oid in result.inserted_ids]


async def delete_chunks_by_document(document_id: str, user_id: str) -> int:
    """
    Delete all chunks for a document. Enforces user ownership.
    Returns number of deleted documents.
    """
    db = get_database()
    result = await db.document_chunks.delete_many({
        "document_id": ObjectId(document_id),
        "user_id": ObjectId(user_id),
    })
    return result.deleted_count
