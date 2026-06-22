"""Global FastAPI exception handlers.

Every non-2xx response is normalised to the standard error envelope (architecture §3.2):
    { "error": { "code": "...", "message": "...", "details": [...] } }
"""

from __future__ import annotations

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    if isinstance(exc.detail, dict):
        error = exc.detail
    else:
        # Map common status codes to envelope codes.
        code_map = {
            404: "NOT_FOUND",
            409: "CONFLICT",
            500: "INTERNAL_ERROR",
        }
        error = {
            "code": code_map.get(exc.status_code, "ERROR"),
            "message": str(exc.detail),
        }
    return JSONResponse(status_code=exc.status_code, content={"error": error})


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    details = []
    for err in exc.errors():
        loc = err.get("loc", [])
        # Strip the leading "body" segment that Pydantic prepends.
        field = ".".join(str(part) for part in loc if part != "body")
        details.append({"field": field, "message": err["msg"]})

    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed.",
                "details": details,
            }
        },
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred."}},
    )
