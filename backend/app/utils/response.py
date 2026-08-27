"""
Standardized API response helpers.
"""
from typing import Any, Optional
from fastapi.responses import JSONResponse


def success_response(data: Any = None, message: str = "Success", status_code: int = 200) -> dict:
    """Return a standardized success response."""
    return {
        "success": True,
        "data": data,
        "message": message,
    }


def error_response(message: str, code: str = "ERROR", status_code: int = 400) -> JSONResponse:
    """Return a standardized error response."""
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "code": code,
                "message": message,
            }
        }
    )
