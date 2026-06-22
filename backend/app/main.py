"""FastAPI application factory — CORS middleware, exception handlers, router registration."""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.config import get_settings
from app.exceptions import (
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.routers import owners, pets

settings = get_settings()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Append security-hardening headers to every response (L3)."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        return response


app = FastAPI(
    title="Pet Management System API",
    description="REST API for managing pets and owners (v1).",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# --- Security headers -------------------------------------------------------
app.add_middleware(SecurityHeadersMiddleware)

# --- CORS -------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)

# --- Exception handlers -----------------------------------------------------
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# --- Routers ----------------------------------------------------------------
app.include_router(owners.router, prefix="/api/v1")
app.include_router(pets.router, prefix="/api/v1")


@app.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok"}
