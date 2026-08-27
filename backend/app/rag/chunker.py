"""
Text chunker for RAG pipeline.
Splits documents into overlapping chunks with metadata.
Target: 500-1000 tokens per chunk with overlap.
"""
import re
from typing import List, Dict, Any


# Approximate chars per token (rough estimate: 4 chars ≈ 1 token)
CHARS_PER_TOKEN = 4
TARGET_CHUNK_TOKENS = 800
OVERLAP_TOKENS = 100
TARGET_CHUNK_CHARS = TARGET_CHUNK_TOKENS * CHARS_PER_TOKEN  # ~3200 chars
OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN  # ~400 chars


def chunk_text(
    text: str,
    document_id: str,
    document_type: str,
    user_id: str,
    source_name: str,
    metadata: Dict[str, Any] = None,
) -> List[Dict[str, Any]]:
    """
    Split text into overlapping chunks with metadata.
    
    Args:
        text: The full text to chunk
        document_id: ID of the source document
        document_type: 'resume' or 'job'
        user_id: Owner user ID (for security filtering)
        source_name: File name or document name
        metadata: Additional metadata to attach to each chunk
    
    Returns:
        List of chunk dicts ready for embedding and storage
    """
    # Clean and split into paragraphs
    paragraphs = _split_into_paragraphs(text)

    chunks = []
    current_chunk = ""
    current_section = "general"
    chunk_index = 0

    for para in paragraphs:
        # Detect section headers
        section = _detect_section(para)
        if section:
            current_section = section

        # If adding this paragraph would exceed the limit, save current chunk
        if len(current_chunk) + len(para) > TARGET_CHUNK_CHARS and current_chunk.strip():
            chunk = _build_chunk(
                text=current_chunk.strip(),
                chunk_index=chunk_index,
                document_id=document_id,
                document_type=document_type,
                user_id=user_id,
                source_name=source_name,
                section=current_section,
                extra_metadata=metadata or {},
            )
            chunks.append(chunk)
            chunk_index += 1

            # Overlap: keep last N chars of previous chunk
            overlap_text = current_chunk[-OVERLAP_CHARS:] if len(current_chunk) > OVERLAP_CHARS else current_chunk
            current_chunk = overlap_text + "\n" + para
        else:
            current_chunk += "\n" + para if current_chunk else para

    # Add remaining text as final chunk
    if current_chunk.strip():
        chunk = _build_chunk(
            text=current_chunk.strip(),
            chunk_index=chunk_index,
            document_id=document_id,
            document_type=document_type,
            user_id=user_id,
            source_name=source_name,
            section=current_section,
            extra_metadata=metadata or {},
        )
        chunks.append(chunk)

    return chunks


def _build_chunk(
    text: str,
    chunk_index: int,
    document_id: str,
    document_type: str,
    user_id: str,
    source_name: str,
    section: str,
    extra_metadata: dict,
) -> Dict[str, Any]:
    return {
        "user_id": user_id,
        "document_id": document_id,
        "document_type": document_type,
        "chunk_index": chunk_index,
        "text": text,
        "metadata": {
            "section": section,
            "source": source_name,
            **extra_metadata,
        },
        "embedding": [],  # will be filled by embedding service
    }


def _split_into_paragraphs(text: str) -> List[str]:
    """Split text by double newlines, filter empty."""
    paragraphs = re.split(r"\n\s*\n", text)
    return [p.strip() for p in paragraphs if p.strip()]


# Common resume and job section headers
SECTION_KEYWORDS = {
    "experience": ["experience", "work history", "employment", "career"],
    "education": ["education", "academic", "degree", "university", "college"],
    "skills": ["skills", "technical skills", "technologies", "competencies", "expertise"],
    "projects": ["projects", "portfolio", "work samples", "open source"],
    "summary": ["summary", "objective", "profile", "about", "overview"],
    "certifications": ["certifications", "certificates", "licenses", "achievements"],
    "requirements": ["requirements", "qualifications", "what we're looking for", "must have"],
    "responsibilities": ["responsibilities", "duties", "what you'll do", "role overview"],
}


def _detect_section(text: str) -> str:
    """Detect if this paragraph is a section header."""
    lower = text.lower().strip()
    # Only check short lines (likely headers)
    if len(lower) > 80:
        return None
    for section, keywords in SECTION_KEYWORDS.items():
        for kw in keywords:
            if kw in lower:
                return section
    return None
