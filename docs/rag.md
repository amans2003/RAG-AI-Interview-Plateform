# RAG Pipeline — AI Job & Resume Intelligence Platform

## Overview

This platform uses a real **Retrieval-Augmented Generation (RAG)** pipeline.
It does NOT dump full documents into Gemini. Instead, it retrieves only the most relevant chunks.

## Pipeline Steps

### 1. Text Extraction
- PDF: `pdfplumber` — extracts text preserving structure
- DOCX: `python-docx` — extracts paragraphs
- TXT: UTF-8 decode with error replacement
- Factory pattern routes to correct parser

### 2. Cleaning
- Normalize line endings
- Remove excessive whitespace and blank lines
- Strip non-printable characters
- Preserve structure for meaningful chunking

### 3. Chunking (`app/rag/chunker.py`)
- Target: 500–1000 tokens per chunk (~3200 chars)
- Overlap: ~100 tokens between consecutive chunks
- Metadata attached to each chunk:
  - `document_id` — source document
  - `document_type` — "resume" or "job"
  - `user_id` — owner (for security filtering)
  - `section` — detected section (experience, skills, education, etc.)
  - `source` — file name
  - `chunk_index` — position in document

### 4. Embedding Generation (`app/ai/embeddings.py`)
- Model: `models/text-embedding-004` (Google Gemini)
- Document chunks: `task_type="retrieval_document"`
- Queries: `task_type="retrieval_query"` (asymmetric retrieval)
- Returns 768-dimensional float vectors
- Abstracted — only this file needs updating if the provider changes

### 5. Vector Storage (`app/rag/vector_search.py`)
- Stored in MongoDB Atlas `document_chunks` collection
- `embedding` field holds the float vector
- Indexed via **MongoDB Atlas Vector Search**
- Index name: `document_chunks_vector_index`
- Index must be created in Atlas UI:
  ```json
  {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": 768,
        "similarity": "cosine"
      },
      {"type": "filter", "path": "user_id"},
      {"type": "filter", "path": "document_id"},
      {"type": "filter", "path": "document_type"}
    ]
  }
  ```

### 6. Semantic Retrieval (`app/rag/retriever.py`)
1. Embed the query using `task_type="retrieval_query"`
2. Run MongoDB Atlas `$vectorSearch` aggregation
3. Apply pre-filters: `user_id`, `document_id`, `document_type`
4. Return top-K most similar chunks (default: 5)

### 7. Context Construction (`app/rag/context_builder.py`)
- Retrieved chunks are formatted with labels:
  `[RESUME - EXPERIENCE - Chunk 3]`
- Multiple chunks concatenated
- Source references extracted for frontend display

### 8. Gemini Generation (`app/ai/gemini_client.py`)
- Context + question/prompt sent to `gemini-1.5-flash`
- Structured responses use `response_mime_type: "application/json"`
- Temperature 0.1 for analysis (deterministic), 0.3 for chat (natural)

### 9. Source References
Each RAG response includes sources:
```json
{
  "document_type": "resume",
  "document_name": "resume.pdf",
  "section": "experience",
  "chunk_index": 3
}
```
These are displayed in the chat UI below each AI response.

### 10. Anti-Hallucination Strategy
System prompts enforce:
- "Answer ONLY using the provided context"
- "If information is unavailable, say it was not found"
- "NEVER invent skills, experience, companies, education, or projects"
- "Clearly distinguish between resume facts and AI recommendations"
- When context is empty → friendly "not enough information" message
