"""
Embedding generation using Google Gemini embedding models.
Configurable abstraction — only this file needs to change if the embedding provider changes.
"""
import logging
from typing import List
import google.generativeai as genai
from app.config.settings import settings

logger = logging.getLogger(__name__)

# Configure API key
genai.configure(api_key=settings.gemini_api_key)


async def generate_embedding(text: str) -> List[float]:
    """
    Generate an embedding vector for a single text.
    Uses the configured embedding model.
    Returns a list of floats.
    """
    try:
        result = genai.embed_content(
            model=settings.embedding_model,
            content=text,
            task_type="retrieval_document",
        )
        return result["embedding"]
    except Exception as e:
        logger.error(f"Embedding generation error: {e}")
        raise RuntimeError(f"Failed to generate embedding: {str(e)}")


async def generate_query_embedding(text: str) -> List[float]:
    """
    Generate an embedding for a search query.
    Uses query-specific task type for better retrieval.
    """
    try:
        result = genai.embed_content(
            model=settings.embedding_model,
            content=text,
            task_type="retrieval_query",
        )
        return result["embedding"]
    except Exception as e:
        logger.error(f"Query embedding generation error: {e}")
        raise RuntimeError(f"Failed to generate query embedding: {str(e)}")


async def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for multiple texts.
    Processes individually (batching if needed in future).
    """
    embeddings = []
    for text in texts:
        emb = await generate_embedding(text)
        embeddings.append(emb)
    return embeddings
