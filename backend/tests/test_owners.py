"""Owner acceptance-criteria tests (architecture §3.5, BA spec §Owner CRUD & guards)."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


# ---------------------------------------------------------------------------
# Create owner
# ---------------------------------------------------------------------------

async def test_create_owner_returns_201(client: AsyncClient):
    resp = await client.post("/api/v1/owners", json={"full_name": "Jane Smith", "email": "jane@example.com"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["full_name"] == "Jane Smith"
    assert body["email"] == "jane@example.com"
    assert body["pet_count"] == 0
    assert "id" in body


async def test_create_owner_missing_full_name_returns_422(client: AsyncClient):
    resp = await client.post("/api/v1/owners", json={"email": "no_name@example.com"})
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "VALIDATION_ERROR"


async def test_create_owner_duplicate_email_returns_409(client: AsyncClient):
    payload = {"full_name": "Alice", "email": "alice@example.com"}
    await client.post("/api/v1/owners", json=payload)
    resp = await client.post("/api/v1/owners", json={"full_name": "Alice2", "email": "alice@example.com"})
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "CONFLICT"


async def test_create_owner_duplicate_null_email_allowed(client: AsyncClient):
    """Multiple owners with NULL email must be allowed (unique index permits NULL repeats)."""
    r1 = await client.post("/api/v1/owners", json={"full_name": "No Email 1"})
    r2 = await client.post("/api/v1/owners", json={"full_name": "No Email 2"})
    assert r1.status_code == 201
    assert r2.status_code == 201


# ---------------------------------------------------------------------------
# Read owner
# ---------------------------------------------------------------------------

async def test_get_owner_returns_200(client: AsyncClient):
    create = await client.post("/api/v1/owners", json={"full_name": "Bob"})
    owner_id = create.json()["id"]
    resp = await client.get(f"/api/v1/owners/{owner_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == owner_id


async def test_get_owner_not_found_returns_404(client: AsyncClient):
    resp = await client.get("/api/v1/owners/999999")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


# ---------------------------------------------------------------------------
# Update owner
# ---------------------------------------------------------------------------

async def test_update_owner_returns_200(client: AsyncClient):
    create = await client.post("/api/v1/owners", json={"full_name": "Old Name"})
    owner_id = create.json()["id"]
    resp = await client.put(f"/api/v1/owners/{owner_id}", json={"full_name": "New Name"})
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "New Name"


async def test_update_owner_not_found_returns_404(client: AsyncClient):
    resp = await client.put("/api/v1/owners/999999", json={"full_name": "Ghost"})
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Delete owner
# ---------------------------------------------------------------------------

async def test_delete_owner_no_pets_returns_204(client: AsyncClient):
    create = await client.post("/api/v1/owners", json={"full_name": "To Delete"})
    owner_id = create.json()["id"]
    resp = await client.delete(f"/api/v1/owners/{owner_id}")
    assert resp.status_code == 204
    assert (await client.get(f"/api/v1/owners/{owner_id}")).status_code == 404


async def test_delete_owner_not_found_returns_404(client: AsyncClient):
    resp = await client.delete("/api/v1/owners/999999")
    assert resp.status_code == 404


async def test_delete_owner_with_pets_returns_409(client: AsyncClient):
    """FR-7: owner with active pets cannot be deleted (delete guard)."""
    owner = (await client.post("/api/v1/owners", json={"full_name": "Owner With Pet"})).json()
    await client.post("/api/v1/pets", json={"name": "Buddy", "species": "Dog", "owner_id": owner["id"]})
    resp = await client.delete(f"/api/v1/owners/{owner['id']}")
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "CONFLICT"


# ---------------------------------------------------------------------------
# List / search
# ---------------------------------------------------------------------------

async def test_list_owners_pagination(client: AsyncClient):
    for i in range(5):
        await client.post("/api/v1/owners", json={"full_name": f"Owner {i}"})
    resp = await client.get("/api/v1/owners?page=1&page_size=3")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["data"]) == 3
    assert body["pagination"]["total"] == 5
    assert body["pagination"]["total_pages"] == 2


async def test_list_owners_search(client: AsyncClient):
    await client.post("/api/v1/owners", json={"full_name": "Findable Owner", "email": "find@test.com"})
    await client.post("/api/v1/owners", json={"full_name": "Other Owner"})
    resp = await client.get("/api/v1/owners?search=Findable")
    assert resp.status_code == 200
    assert resp.json()["pagination"]["total"] == 1


# ---------------------------------------------------------------------------
# CSV export
# ---------------------------------------------------------------------------

async def test_export_owners_csv(client: AsyncClient):
    await client.post("/api/v1/owners", json={"full_name": "CSV Owner"})
    resp = await client.get("/api/v1/owners/export/csv")
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    assert "CSV Owner" in resp.text


# ---------------------------------------------------------------------------
# Security headers (L3 — SecurityHeadersMiddleware)
# ---------------------------------------------------------------------------

async def test_security_headers_present(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.headers.get("x-content-type-options") == "nosniff"
    assert resp.headers.get("referrer-policy") == "no-referrer"


async def test_search_max_length_rejected(client: AsyncClient):
    """search param longer than 200 chars must return 422 (L1)."""
    resp = await client.get("/api/v1/owners", params={"search": "x" * 201})
    assert resp.status_code == 422
