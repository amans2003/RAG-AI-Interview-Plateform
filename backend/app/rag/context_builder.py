"""
Context builder — converts retrieved chunks into a formatted context string
and extracts source references for the frontend.
"""
from typing import List, Tuple


def build_context(chunks: List[dict]) -> Tuple[str, List[dict]]:
    """
    Build a formatted context string from retrieved chunks.
    Also returns source references.
    
    Returns:
        (context_string, sources_list)
    """
    if not chunks:
        return "", []

    context_parts = []
    sources = []

    for i, chunk in enumerate(chunks):
        metadata = chunk.get("metadata", {})
        section = metadata.get("section", "general")
        source = metadata.get("source", "document")
        doc_type = chunk.get("document_type", "document")
        chunk_index = chunk.get("chunk_index", i)

        # Format chunk with context label
        label = f"[{doc_type.upper()} - {section.upper()} - Chunk {chunk_index}]"
        context_parts.append(f"{label}\n{chunk.get('text', '')}")

        # Build source reference
        source_ref = {
            "document_type": doc_type,
            "document_name": source,
            "section": section,
            "chunk_index": chunk_index,
        }
        # Avoid duplicate sources
        if source_ref not in sources:
            sources.append(source_ref)

    context_string = "\n\n".join(context_parts)
    return context_string, sources


def build_analysis_context(
    resume_chunks: List[dict],
    job_chunks: List[dict],
) -> Tuple[str, str]:
    """
    Build separate context strings for resume and job analysis.
    
    Returns:
        (resume_context, job_context)
    """
    resume_parts = [c.get("text", "") for c in resume_chunks]
    job_parts = [c.get("text", "") for c in job_chunks]

    resume_context = "\n\n".join(resume_parts)
    job_context = "\n\n".join(job_parts)

    return resume_context, job_context
