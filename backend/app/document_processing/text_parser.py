"""
Plain text file extraction.
"""
import logging

logger = logging.getLogger(__name__)


def extract_text_from_txt(file_bytes: bytes) -> str:
    """Decode text file from bytes."""
    try:
        text = file_bytes.decode("utf-8", errors="replace").strip()
        if not text:
            raise ValueError("Empty text file")
        return text
    except Exception as e:
        logger.error(f"TXT extraction error: {e}")
        raise ValueError(f"Failed to read text file: {str(e)}")
