"""
Centralized Gemini API client.
All AI interactions go through this module with automatic multi-model fallback.
"""
import json
import re
import logging
from typing import Any, Optional, List
import google.generativeai as genai
from app.config.settings import settings

logger = logging.getLogger(__name__)

# Fallback sequence of high-performance Gemini models
CANDIDATE_MODELS = [
    settings.generation_model,
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash",
]


def _get_unique_models() -> List[str]:
    seen = set()
    result = []
    for m in CANDIDATE_MODELS:
        if m and m not in seen:
            seen.add(m)
            result.append(m)
    return result


async def generate_text(prompt: str, temperature: float = 0.3) -> str:
    """
    Generate text from a prompt using Gemini with automatic model fallback.
    Returns the response text.
    """
    genai.configure(api_key=settings.gemini_api_key)
    models = _get_unique_models()
    last_err = None

    for model_name in models:
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config={
                    "temperature": temperature,
                    "top_p": 0.95,
                    "max_output_tokens": 4096,
                }
            )
            response = await model.generate_content_async(prompt)
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            err_msg = str(e)
            last_err = e
            logger.warning(f"Gemini model {model_name} failed ({err_msg[:120]}), attempting fallback model...")
            continue

    logger.error(f"All Gemini models exhausted. Last error: {last_err}")
    raise RuntimeError(f"AI generation failed: {str(last_err)}")


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

    return json.loads(cleaned)


async def generate_structured_response(prompt: str, temperature: float = 0.1) -> Any:
    """
    Generate a structured JSON response from Gemini with automatic model fallback.
    Returns the parsed dict/list or raises RuntimeError.
    """
    genai.configure(api_key=settings.gemini_api_key)
    models = _get_unique_models()
    last_err = None

    for model_name in models:
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
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
            logger.error(f"Gemini JSON parse error with {model_name}: {e}")
            last_err = e
            continue
        except Exception as e:
            logger.warning(f"Gemini structured response with {model_name} failed: {e}")
            last_err = e
            continue

    raise RuntimeError(f"AI structured generation failed: {str(last_err)}")
