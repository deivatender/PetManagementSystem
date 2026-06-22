# Pet Management System -- Backend

**FastAPI + SQLAlchemy async + Alembic -- REST API v1**

## Stack

| Concern | Choice |
|---------|--------|
| Framework | FastAPI 0.115 (async-native, auto OpenAPI) |
| ORM | SQLAlchemy 2.0 async (aiomysql driver) |
| Validation | Pydantic v2 |
| Migrations | Alembic 1.14 |
| ASGI server | Uvicorn 0.34 |
| Tests | pytest + pytest-asyncio + httpx |

## Quick start

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # macOS/Linux
# .venv\Scripts\activate       # Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env: set DATABASE_URL
alembic upgrade head
mysql -u pms_user -p pet_management < sql/seed.sql  # optional seed data
uvicorn app.main:app --reload --port 8000
```

## Project layout

```
app/
  main.py        -- FastAPI app factory, CORS, exception handlers, routers
  config.py      -- pydantic-settings (DATABASE_URL, CORS_ORIGINS, pool tuning)
  database.py    -- SQLAlchemy async engine, session factory, get_db dependency
  models/        -- SQLAlchemy ORM models (Owner, Pet)
  schemas/       -- Pydantic v2 request/response schemas
  routers/       -- FastAPI route definitions (owners, pets)
  services/      -- Business logic (CRUD, CSV export, pagination)
  exceptions.py  -- Global error handlers -> standard error envelope
migrations/      -- Alembic version scripts
  versions/
    001_initial_schema.py
sql/             -- Reference DDL and idempotent seed data
tests/           -- pytest suite (39 tests)
requirements.txt
alembic.ini
.env.example
```

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| DATABASE_URL | Yes | -- | mysql+aiomysql://user:pass@host:3306/db |
| DB_POOL_SIZE | No | 10 | Connection pool size |
| DB_MAX_OVERFLOW | No | 20 | Max overflow connections |
| DB_POOL_TIMEOUT | No | 30 | Seconds to wait for free connection |
| DB_POOL_RECYCLE | No | 1800 | Recycle connections every 30 min |
| DB_ECHO | No | false | Set true to log SQL in dev |
| CORS_ORIGINS | No | http://localhost:5173 | Comma-separated allowed origins |

## Running tests

```bash
cd backend
source .venv/bin/activate
pytest -v
```

39 tests using in-memory SQLite -- no MySQL needed.

## Migrations

```bash
# Apply pending migrations
alembic upgrade head

# Create a new migration (autogenerate)
alembic revision --autogenerate -m "description"

# Rollback one step
alembic downgrade -1
```

## API

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health: GET http://localhost:8000/health

All routes under /api/v1. See the root README.md for the full endpoint table.
