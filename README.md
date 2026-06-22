# Pet Management System

**REST API + React SPA for managing pets and owners (v1).**

A three-layer web application for recording, searching, and maintaining pet
records. Designed as an internal tool for a single organisation -- open within
the trusted internal network, with no authentication in v1.

---

## Table of Contents

- [Architecture overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Running the tests](#running-the-tests)
- [API reference](#api-reference)
- [Configuration reference](#configuration-reference)
- [Project structure](#project-structure)
- [Operations & handover](#operations--handover)
- [Known limitations & future work](#known-limitations--future-work)
- [Acceptance checklist](#acceptance-checklist)

---

## Architecture overview

```
React 18 + TS (Vite)  ---REST/JSON--->  FastAPI + SQLAlchemy  ---async ORM--->  MySQL 8.x
      :5173                     JSON         :8000                               :3306
```

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| **Frontend** | React 18 + TypeScript, Vite 5, Tailwind CSS | UI, client-side validation, data fetching |
| **API** | Python 3.12, FastAPI, SQLAlchemy 2.x async, Pydantic v2 | Request routing, business logic, ORM, validation |
| **Database** | MySQL 8.x | Persistence, referential integrity, indexing |

### v1 scope notes

- **No authentication** (design decision A2) -- all endpoints are open within the
  trusted internal network. Auth is deferred to v2.
- **Age is computed** from `date_of_birth` at response time -- never stored (ADR-2).
- **Owner delete guard** (FR-7) enforced at both application layer (409) and
  database level (`ON DELETE RESTRICT`) for defence-in-depth (ADR-1).

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.12+ | Lower versions may work but untested |
| Node.js | 18+ | Required for the frontend build |
| npm | 10+ | Comes with Node.js |
| MySQL | 8.x | InnoDB engine, utf8mb4 charset |
| Docker (optional) | latest | For running MySQL locally via container |

---

## Local setup

### 1. MySQL database

Create the database and user:

```sql
CREATE DATABASE pet_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pms_user'@'localhost' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON pet_management.* TO 'pms_user'@'localhost';
FLUSH PRIVILEGES;
```

Run MySQL via Docker if you don't have it installed:

```bash
docker run -d --name pms-mysql -e MYSQL_ROOT_PASSWORD=*** -e MYSQL_DATABASE=pet_management -e MYSQL_USER=pms_user -e MYSQL_PASSWORD=*** -p 3306:3306 mysql:8 --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
```

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # macOS/Linux
# .venv\Scripts\activate       # Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env -- set DATABASE_URL to your MySQL connection string
alembic upgrade head
mysql -u pms_user -p pet_management < sql/seed.sql   # (optional) seed data
uvicorn app.main:app --reload --port 8000
```

API: **http://localhost:8000** | Swagger: **http://localhost:8000/docs** | ReDoc: **http://localhost:8000/redoc**

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The Vite dev server runs at **http://localhost:5173** and proxies /api to http://localhost:8000.

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server with HMR at :5173 |
| `npm run build` | Type-check + production build |
| `npm run test` | Run Vitest once |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check |

---

## Running the tests

### Backend (39 tests)

```bash
cd backend
source .venv/bin/activate
pytest -v
```

Tests use an in-memory SQLite database -- no MySQL connection needed.

### Frontend

```bash
cd frontend
npm run test
```

---

## API reference

**Base URL:** `/api/v1`

The live Swagger/OpenAPI documentation is available at **`/docs`** when the
backend is running -- this is the authoritative contract reference.

### Endpoint summary

| Method | Endpoint | Description | Status codes |
|--------|----------|-------------|--------------|
| GET | /api/v1/health | Health check | 200 |
| GET | /api/v1/owners | List/search owners (paginated) | 200 |
| POST | /api/v1/owners | Create owner | 201, 409, 422 |
| GET | /api/v1/owners/{id} | Get owner by ID | 200, 404 |
| PUT | /api/v1/owners/{id} | Full-update owner | 200, 404, 409, 422 |
| DELETE | /api/v1/owners/{id} | Delete owner (guarded) | 204, 404, 409 |
| GET | /api/v1/owners/export/csv | Export filtered owners as CSV | 200 |
| GET | /api/v1/pets | List/filter/search pets (paginated) | 200 |
| POST | /api/v1/pets | Create pet | 201, 422 |
| GET | /api/v1/pets/{id} | Get pet by ID | 200, 404 |
| PUT | /api/v1/pets/{id} | Full-update pet | 200, 404, 422 |
| DELETE | /api/v1/pets/{id} | Hard-delete pet | 204, 404 |
| GET | /api/v1/pets/export/csv | Export filtered pets as CSV | 200 |

### List query parameters

**Owners:** page (default: 1), page_size (1-100, default: 20), sort (full_name or created_at), order (asc or desc), search (partial match on name, email, phone)

**Pets:** Same pagination plus species, status, owner_id filters; search on name, breed

### Error envelope

```json
{"error": {"code": "VALIDATION_ERROR", "message": "...", "details": [{"field": "name", "message": "field required"}]}}
```

| Code | HTTP | Meaning |
|------|------|---------|
| VALIDATION_ERROR | 422 | Field-level validation failure |
| NOT_FOUND | 404 | Resource does not exist |
| CONFLICT | 409 | Duplicate email / owner has pets |
| INTERNAL_ERROR | 500 | Unexpected server error |

---

## Configuration reference

### Backend (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| DATABASE_URL | Yes | -- | Async SQLAlchemy URL: mysql+aiomysql://user:***@host:3306/db |
| DB_POOL_SIZE | No | 10 | Connection pool size |
| DB_MAX_OVERFLOW | No | 20 | Max overflow connections |
| DB_POOL_TIMEOUT | No | 30 | Seconds to wait for a free connection |
| DB_POOL_RECYCLE | No | 1800 | Recycle connections every 30 min |
| DB_ECHO | No | false | Set true to log SQL in development |
| CORS_ORIGINS | No | http://localhost:5173 | Comma-separated allowed origins |

### Frontend (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| VITE_API_BASE_URL | No | /api/v1 | Base URL for the API |
| VITE_DEV_API_PROXY | No | http://localhost:8000 | Override Vite dev proxy target |

---

## Project structure

```
pet-management/
  README.md                   This file
  backend/
    app/
      main.py                 FastAPI app factory, CORS, routers
      config.py               pydantic-settings configuration
      database.py             SQLAlchemy async engine + session
      models/                 ORM models (Owner, Pet)
      schemas/                Pydantic v2 request/response schemas
      routers/                FastAPI route definitions
      services/               Business logic layer
      exceptions.py           Error handlers
    migrations/               Alembic migration scripts
    sql/                      Reference DDL + seed data
    tests/                    pytest suite (39 tests)
    alembic.ini
    requirements.txt
    .env.example
  frontend/
    src/                      React app source
    package.json
    vite.config.ts
    README.md                 Frontend-specific documentation
  coverage_traceability_matrix.md
```

---

## Operations & handover

### Target environment

No target deployment environment has been defined. The build is ready for
deployment pending: (a) a MySQL 8.x instance, (b) a host for the FastAPI
backend, and (c) a static file server or container for frontend assets.

### Deploy steps

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Frontend:**
```bash
cd frontend
npm ci && npm run build
# Serve dist/ via nginx, Caddy, or similar.
```

**Rollback:**
```bash
alembic downgrade -1
```

### Migration state

- **Current revision:** 001 -- creates owners and pets tables.
- **Rollback:** alembic downgrade 001 drops both tables (destructive).

### Security hardening (open items from TSI-10)

Non-blocking low-severity items recommended before production:

| # | Finding | Affected | Remediation |
|---|---------|----------|-------------|
| L1 | Unbounded search parameter | routers/owners.py, routers/pets.py | Add max_length=200 to search params |
| L2 | Permissive CORS methods/headers | main.py | Replace ["*"] with explicit allow-lists |
| L3 | Missing security headers | main.py | Add ASGI middleware |
| L4 | aiomysql 0.2.0 maintenance risk | requirements.txt | Monitor for updates |

---

## Known limitations & future work

### Out of scope (v1)

1. Authentication, user accounts, roles/permissions (deferred to v2).
2. Medical/vaccination records, appointments, scheduling, reminders.
3. File/photo uploads for pets or owners.
4. Multi-tenant / multi-organisation support.
5. Audit log / change history beyond created_at / updated_at.
6. Notifications (email/SMS), payments, billing.
7. Dashboards, charts, advanced analytics (CSV export only).
8. Mobile native apps; bulk import.
9. Partial-update endpoints (PATCH) -- v1 uses full-replace PUT only.

### Assumptions

- Deployment on a trusted internal network -- no auth in v1.
- Data volume <= 50k pets, 20k owners.
- Browser support: latest 2 versions of Chrome, Edge, Firefox; desktop-first.

---

## Acceptance checklist

### Pet CRUD
- [ ] Valid pet creation returns 201 with status defaulting to Active
- [ ] Missing name / invalid species returns 422 with field-level errors
- [ ] Future date_of_birth returns 422
- [ ] Get pet by ID returns 200 / 404
- [ ] Update pet persists changes, updated_at advances
- [ ] Setting status to Deceased keeps pet retrievable (soft-delete)
- [ ] Hard-delete returns 204, subsequent GET returns 404
- [ ] Pet list supports pagination, sorting, filtering
- [ ] Pet search returns case-insensitive partial matches on name and breed
- [ ] CSV export returns filtered pet data with correct content-type

### Owner CRUD & guards
- [ ] Valid owner creation returns 201
- [ ] Duplicate email returns 409; duplicate null email allowed
- [ ] Get owner by ID returns 200 / 404
- [ ] Update owner persists changes
- [ ] Delete owner with no pets returns 204
- [ ] Delete owner with pets returns 409 (FR-7 guard)
- [ ] Owner list supports pagination, sorting, and search
- [ ] CSV export returns filtered owner data

### Owner-Pet link
- [ ] Pet can be assigned to existing owner; response includes owner summary
- [ ] Non-existent owner_id on create returns 422
- [ ] Non-existent owner_id on update returns 422

### General
- [ ] All error responses follow the standard error envelope
- [ ] Paginated responses include page metadata
- [ ] Backend test suite: 39 tests pass
- [ ] Frontend builds without TypeScript or lint errors
- [ ] Swagger UI available at /docs

---

*Documentation generated: 22 June 2026 | Backend tests: 39/39 passing*
