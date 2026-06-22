"""SQLAlchemy async engine, session factory, and declarative base.

This is the single data-access boundary for the application. Routers and
services depend on :func:`get_db`; they never construct engines themselves
(Database Developer connection discipline — keep engine-specific code behind a
thin boundary).
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

# --- Engine -----------------------------------------------------------------
# Pooled async engine. pool_pre_ping guards against stale connections dropped
# by the server; pool_recycle keeps connections under MySQL's wait_timeout.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_recycle=settings.DB_POOL_RECYCLE,
    pool_pre_ping=True,
)

# --- Session factory --------------------------------------------------------
# expire_on_commit=False keeps attribute access valid after commit, which the
# async request lifecycle relies on (objects are often serialized post-commit).
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a request-scoped async session.

    The session is always closed (returned to the pool) on request teardown.
    Rolls back on error so a failed request never leaks a dirty transaction.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
