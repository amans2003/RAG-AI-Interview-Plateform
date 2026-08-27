"""
Parser factory — routes files to the correct parser based on extension.
"""
from app.document_processing.pdf_parser import extract_text_from_pdf
from app.document_processing.docx_parser import extract_text_from_docx
from app.document_processing.text_parser import extract_text_from_txt
import re


def extract_text(file_bytes: bytes, file_extension: str) -> str:
    """
    Route to the correct parser based on file extension.
    Extension should be '.pdf', '.docx', or '.txt'.
    """
    ext = file_extension.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext == ".docx":
        return extract_text_from_docx(file_bytes)
    elif ext == ".txt":
        return extract_text_from_txt(file_bytes)
    else:
        raise ValueError(f"Unsupported file extension: {ext}")


def clean_text(text: str) -> str:
    """
    Clean extracted text:
    - Remove excessive whitespace
    - Normalize line endings
    - Strip non-printable characters
    """
    # Normalize newlines
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Remove excessive blank lines (more than 2 consecutive)
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Remove non-printable characters (except newlines and tabs)
    text = re.sub(r"[^\x09\x0A\x20-\x7E\u00A0-\uFFFF]", " ", text)
    # Clean up extra spaces
    text = re.sub(r" {3,}", "  ", text)
    return text.strip()
