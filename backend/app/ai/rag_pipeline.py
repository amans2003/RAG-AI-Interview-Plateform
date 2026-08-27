"""
RAG Pipeline orchestrator.
Manages the full end-to-end flow: retrieve → build context → generate.
"""
import logging
from typing import Optional, Tuple, List
from app.rag.retriever import retrieve_relevant_chunks, retrieve_all_chunks_for_document
from app.rag.context_builder import build_context, build_analysis_context
from app.ai.gemini_client import generate_text, generate_structured_response
from app.ai.prompts import get_rag_chat_prompt, get_analysis_prompt, get_interview_generation_prompt
from app.config.settings import settings

logger = logging.getLogger(__name__)


async def run_chat_rag(
    question: str,
    user_id: str,
    resume_id: Optional[str] = None,
    job_id: Optional[str] = None,
) -> Tuple[str, List[dict]]:
    """
    Full RAG pipeline for chat:
    1. Embed question
    2. Retrieve relevant chunks (filtered by user_id + optional document filters)
    3. Build context
    4. Generate grounded answer
    5. Return answer + source references
    """
    # Retrieve relevant chunks from both resume and job if specified
    chunks = []

    if resume_id:
        resume_chunks = await retrieve_relevant_chunks(
            question=question,
            user_id=user_id,
            top_k=settings.rag_top_k,
            document_id=resume_id,
            document_type="resume",
        )
        chunks.extend(resume_chunks)

    if job_id:
        job_chunks = await retrieve_relevant_chunks(
            question=question,
            user_id=user_id,
            top_k=3,
            document_id=job_id,
            document_type="job",
        )
        chunks.extend(job_chunks)

    # If no specific documents, search all user documents
    if not resume_id and not job_id:
        chunks = await retrieve_relevant_chunks(
            question=question,
            user_id=user_id,
            top_k=settings.rag_top_k,
        )

    if not chunks:
        no_context_answer = (
            "I couldn't find enough relevant information in your uploaded documents to answer that question. "
            "Please make sure you've uploaded a resume and/or job description first."
        )
        return no_context_answer, []

    # Build context and source references
    context, sources = build_context(chunks)

    # Generate grounded response
    prompt = get_rag_chat_prompt(question=question, context=context)
    answer = await generate_text(prompt, temperature=0.3)

    return answer, sources


async def run_analysis_rag(
    resume_id: str,
    job_id: str,
    user_id: str,
) -> dict:
    """
    Full RAG pipeline for resume/job analysis:
    1. Retrieve all chunks for resume and job
    2. Build analysis context
    3. Send to Gemini for structured analysis
    4. Return validated analysis result
    """
    # Retrieve resume chunks
    resume_chunks = await retrieve_all_chunks_for_document(
        document_id=resume_id,
        user_id=user_id,
        document_type="resume",
    )

    # Retrieve job chunks
    job_chunks = await retrieve_all_chunks_for_document(
        document_id=job_id,
        user_id=user_id,
        document_type="job",
    )

    if not resume_chunks:
        raise ValueError("No resume content found. Please re-upload your resume.")
    if not job_chunks:
        raise ValueError("No job description content found. Please re-add the job.")

    # Build context strings
    resume_context, job_context = build_analysis_context(resume_chunks, job_chunks)

    # Generate analysis
    prompt = get_analysis_prompt(
        resume_context=resume_context,
        job_context=job_context,
    )
    result = await generate_structured_response(prompt, temperature=0.1)
    return result


async def run_interview_rag(
    resume_id: str,
    job_id: str,
    user_id: str,
    missing_skills: list = None,
    matching_skills: list = None,
) -> list:
    """
    RAG pipeline for interview question generation.
    """
    resume_chunks = await retrieve_all_chunks_for_document(
        document_id=resume_id,
        user_id=user_id,
        document_type="resume",
    )
    job_chunks = await retrieve_all_chunks_for_document(
        document_id=job_id,
        user_id=user_id,
        document_type="job",
    )

    resume_context, job_context = build_analysis_context(resume_chunks, job_chunks)

    prompt = get_interview_generation_prompt(
        resume_context=resume_context,
        job_context=job_context,
        missing_skills=missing_skills or [],
        matching_skills=matching_skills or [],
    )
    result = await generate_structured_response(prompt, temperature=0.4)

    # result should be a list of question objects
    if isinstance(result, list):
        return result
    elif isinstance(result, dict) and "questions" in result:
        return result["questions"]
    else:
        logger.warning(f"Unexpected interview response format: {type(result)}")
        return []
