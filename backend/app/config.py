"""Application configuration.

All environment-specific values are read from environment variables / a local
`.env` file via pydantic-settings. No secrets are hardcoded (architecture §7,
Database Developer connection discipline).
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed application settings, populated from the environment.

    `DATABASE_URL` is required and must use the async ``mysql+aiomysql`` driver
    so the SQLAlchemy async engine can connect.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Database -----------------------------------------------------------
    DATABASE_URL: str = Field(
        ...,
        description="Async SQLAlchemy URL, e.g. mysql+aiomysql://user:pass@host:3306/db",
    )

    # Connection pool tuning. Defaults are sane for the v1 data volume (NFR-2).
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30  # seconds to wait for a free connection
    DB_POOL_RECYCLE: int = 1800  # recycle connections every 30 min (avoid MySQL wait_timeout)
    DB_ECHO: bool = False  # set True to log SQL in development

    # --- CORS (consumed by the Backend layer; kept here for a single config source) ---
    CORS_ORIGINS: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        """CORS_ORIGINS as a clean list of origins."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def sync_database_url(self) -> str:
        """Synchronous URL variant.

        Useful for tooling that cannot drive the async engine (e.g. some
        Alembic offline scenarios). Swaps the async driver for the sync one.
        """
        return self.DATABASE_URL.replace("+aiomysql", "+pymysql")


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (read the environment only once)."""
    return Settings()  # type: ignore[call-arg]
