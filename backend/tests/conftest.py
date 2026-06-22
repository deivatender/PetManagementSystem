"""Pytest fixtures — in-memory SQLite test database, AsyncClient, and session override.

SQLite is used instead of MySQL for speed and zero-infrastructure testing.
MySQL-dialect column types (DATETIME(fsp=6), unsigned INTEGER) fall back to
generic SQLite equivalents, which is sufficient for the logic tests here.
The server_default expressions use CURRENT_TIMESTAMP without fractional seconds
for SQLite compatibility.
"""

from __future__ import annotations

import os

# Must be set before app modules are imported, because app/database.py creates
# the async engine at module load time with MySQL-specific pool params.
# A dummy MySQL URL satisfies Settings validation and lets create_async_engine
# succeed without connecting. The actual DB used in tests is the aiosqlite
# in-memory engine created below; get_db is fully overridden by the fixture.
os.environ.setdefault("DATABASE_URL", "mysql+aiomysql://test:test@localhost:3306/test_db")

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Shared engine — recreated once per test session for speed.
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(
    bind=test_engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_tables():
    """Create all tables once before the test session, drop after."""
    async with test_engine.begin() as conn:
        # Use raw SQLite-compatible DDL to avoid MySQL server_default issues.
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS owners (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name   VARCHAR(150) NOT NULL,
                email       VARCHAR(255) UNIQUE,
                phone       VARCHAR(20),
                address     VARCHAR(255),
                created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS pets (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                name          VARCHAR(100) NOT NULL,
                species       VARCHAR(20) NOT NULL,
                breed         VARCHAR(100),
                date_of_birth DATE,
                gender        VARCHAR(10),
                status        VARCHAR(20) NOT NULL DEFAULT 'Active',
                owner_id      INTEGER REFERENCES owners(id) ON DELETE RESTRICT ON UPDATE CASCADE,
                created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """))
    yield
    async with test_engine.begin() as conn:
        await conn.execute(text("DROP TABLE IF EXISTS pets"))
        await conn.execute(text("DROP TABLE IF EXISTS owners"))


@pytest_asyncio.fixture(autouse=True)
async def clean_tables():
    """Truncate tables between tests to avoid cross-test contamination."""
    yield
    async with test_engine.begin() as conn:
        await conn.execute(text("DELETE FROM pets"))
        await conn.execute(text("DELETE FROM owners"))


@pytest_asyncio.fixture
async def db_session() -> AsyncSession:
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncClient:
    """HTTP client with the DB dependency overridden to the test session."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.pop(get_db, None)
