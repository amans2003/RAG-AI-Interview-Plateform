"""
Centralized Gemini API client.
All AI interactions go through this module.
"""
import json
import re
import logging
from typing import Any, Optional
import google.generativeai as genai
from app.config.settings import settings

logger = logging.getLogger(__name__)

# Initialize Gemini once at module load
genai.configure(api_key=settings.gemini_api_key)

# Default generation model
_model = genai.GenerativeModel(
    model_name=settings.generation_model,
    generation_config={
        "temperature": 0.3,
        "top_p": 0.95,
        "max_output_tokens": 8192,
    }
)


async def generate_text(prompt: str, temperature: float = 0.3) -> str:
    """
    Generate text from a prompt using Gemini.
    Returns the response text.
    """
    try:
        model = genai.GenerativeModel(
            model_name=settings.generation_model,
            generation_config={
                "temperature": temperature,
                "top_p": 0.95,
                "max_output_tokens": 8192,
            }
        )
        response = await model.generate_content_async(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini generate_text error: {e}")
        raise RuntimeError(f"AI generation failed: {str(e)}")


def _safe_json_loads(text: str) -> Any:
    """Robust JSON parsing with markdown stripping and truncation recovery."""
    cleaned = text.strip()

    # Strip markdown fences
    json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", cleaned)
    if json_match:
        cleaned = json_match.group(1).strip()

    # First attempt: direct parsing
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Recovery attempt for truncated JSON array
    if cleaned.startswith("["):
        last_brace = cleaned.rfind("}")
        if last_brace != -1:
            try:
                return json.loads(cleaned[:last_brace + 1] + "\n]")
            except Exception:
                pass

    # Recovery attempt for truncated JSON object
    if cleaned.startswith("{"):
        last_brace = cleaned.rfind("}")
        if last_brace != -1:
            try:
                return json.loads(cleaned[:last_brace + 1])
            except Exception:
                pass

    # Re-raise standard JSONDecodeError if recovery wasn't possible
    return json.loads(cleaned)


async def generate_structured_response(prompt: str, temperature: float = 0.1) -> Any:
    """
    Generate a structured JSON response from Gemini.
    Attempts to parse and validate the JSON output.
    Returns the parsed dict/list or raises RuntimeError.
    """
    try:
        model = genai.GenerativeModel(
            model_name=settings.generation_model,
            generation_config={
                "temperature": temperature,
                "top_p": 0.95,
                "max_output_tokens": 8192,
                "response_mime_type": "application/json",
            }
        )
        response = await model.generate_content_async(prompt)
        text = response.text.strip()
        return _safe_json_loads(text)
    except json.JSONDecodeError as e:
        logger.error(f"Gemini JSON parse error: {e}. Response preview: {text[:300]}")
        raise RuntimeError(f"AI returned malformed JSON: {str(e)}")
    except Exception as e:
        logger.error(f"Gemini structured response error: {e}")
        raise RuntimeError(f"AI structured generation failed: {str(e)}")

