"""Pet acceptance-criteria tests (architecture §3.5, BA spec §Pet CRUD)."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


# ---------------------------------------------------------------------------
# Create pet
# ---------------------------------------------------------------------------

async def test_create_pet_returns_201(client: AsyncClient):
    resp = await client.post("/api/v1/pets", json={"name": "Max", "species": "Dog"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Max"
    assert body["species"] == "Dog"
    assert body["status"] == "Active"
    assert body["age"] is None  # no DOB provided
    assert "id" in body


async def test_create_pet_missing_name_returns_422(client: AsyncClient):
    resp = await client.post("/api/v1/pets", json={"species": "Dog"})
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "VALIDATION_ERROR"


async def test_create_pet_missing_species_returns_422(client: AsyncClient):
    resp = await client.post("/api/v1/pets", json={"name": "Nameless"})
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "VALIDATION_ERROR"


async def test_create_pet_future_dob_returns_422(client: AsyncClient):
    """DOB must not be in the future (NFR-1 / architecture §3.4)."""
    resp = await client.post(
        "/api/v1/pets",
        json={"name": "Future Pet", "species": "Cat", "date_of_birth": "2099-06-01"},
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "VALIDATION_ERROR"


async def test_create_pet_invalid_owner_id_returns_422(client: AsyncClient):
    """Non-existent owner_id is a validation error (FR-3)."""
    resp = await client.post(
        "/api/v1/pets", json={"name": "Orphan", "species": "Dog", "owner_id": 999999}
    )
    assert resp.status_code == 422


async def test_create_pet_with_owner_populates_owner_summary(client: AsyncClient):
    owner = (await client.post("/api/v1/owners", json={"full_name": "Jane Smith"})).json()
    resp = await client.post(
        "/api/v1/pets",
        json={"name": "Fluffy", "species": "Cat", "owner_id": owner["id"]},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["owner_id"] == owner["id"]
    assert body["owner"]["id"] == owner["id"]
    assert body["owner"]["full_name"] == "Jane Smith"


async def test_create_pet_age_computed_from_dob(client: AsyncClient):
    """Derived age is present and non-zero for pets with a past DOB (ADR-2)."""
    resp = await client.post(
        "/api/v1/pets",
        json={"name": "Old Dog", "species": "Dog", "date_of_birth": "2018-01-01"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["age"] is not None
    assert body["age"] >= 6  # born 2018, at least 6 years old by 2026


async def test_create_pet_status_defaults_to_active(client: AsyncClient):
    resp = await client.post("/api/v1/pets", json={"name": "Puppy", "species": "Dog"})
    assert resp.status_code == 201
    assert resp.json()["status"] == "Active"


# ---------------------------------------------------------------------------
# Read pet
# ---------------------------------------------------------------------------

async def test_get_pet_returns_200(client: AsyncClient):
    create = await client.post("/api/v1/pets", json={"name": "Rex", "species": "Dog"})
    pet_id = create.json()["id"]
    resp = await client.get(f"/api/v1/pets/{pet_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == pet_id


async def test_get_pet_not_found_returns_404(client: AsyncClient):
    resp = await client.get("/api/v1/pets/999999")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


# ---------------------------------------------------------------------------
# Update pet
# ---------------------------------------------------------------------------

async def test_update_pet_returns_200(client: AsyncClient):
    create = await client.post("/api/v1/pets", json={"name": "Old Name", "species": "Cat"})
    pet_id = create.json()["id"]
    resp = await client.put(
        f"/api/v1/pets/{pet_id}", json={"name": "New Name", "species": "Cat"}
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"


async def test_update_pet_status_to_deceased(client: AsyncClient):
    """Soft-delete via status: pet remains retrievable after being set to Deceased (FR-6)."""
    create = await client.post("/api/v1/pets", json={"name": "Buddy", "species": "Dog"})
    pet_id = create.json()["id"]
    resp = await client.put(
        f"/api/v1/pets/{pet_id}",
        json={"name": "Buddy", "species": "Dog", "status": "Deceased"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "Deceased"
    # Pet is still retrievable after soft-delete.
    assert (await client.get(f"/api/v1/pets/{pet_id}")).status_code == 200


async def test_update_pet_not_found_returns_404(client: AsyncClient):
    resp = await client.put("/api/v1/pets/999999", json={"name": "Ghost", "species": "Dog"})
    assert resp.status_code == 404


async def test_update_pet_future_dob_returns_422(client: AsyncClient):
    create = await client.post("/api/v1/pets", json={"name": "Ageless", "species": "Cat"})
    pet_id = create.json()["id"]
    resp = await client.put(
        f"/api/v1/pets/{pet_id}",
        json={"name": "Ageless", "species": "Cat", "date_of_birth": "2099-01-01"},
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Delete pet (hard)
# ---------------------------------------------------------------------------

async def test_delete_pet_returns_204_and_404_thereafter(client: AsyncClient):
    """Hard-delete returns 204 and subsequent GET returns 404 (acceptance criteria)."""
    create = await client.post("/api/v1/pets", json={"name": "Temp Pet", "species": "Dog"})
    pet_id = create.json()["id"]
    assert (await client.delete(f"/api/v1/pets/{pet_id}")).status_code == 204
    assert (await client.get(f"/api/v1/pets/{pet_id}")).status_code == 404


async def test_delete_pet_not_found_returns_404(client: AsyncClient):
    resp = await client.delete("/api/v1/pets/999999")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# List / filter / search
# ---------------------------------------------------------------------------

async def test_list_pets_pagination(client: AsyncClient):
    for i in range(5):
        await client.post("/api/v1/pets", json={"name": f"Pet {i}", "species": "Dog"})
    resp = await client.get("/api/v1/pets?page=1&page_size=3")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["data"]) == 3
    assert body["pagination"]["total"] == 5
    assert body["pagination"]["total_pages"] == 2


async def test_list_pets_filter_species(client: AsyncClient):
    await client.post("/api/v1/pets", json={"name": "Dog1", "species": "Dog"})
    await client.post("/api/v1/pets", json={"name": "Cat1", "species": "Cat"})
    await client.post("/api/v1/pets", json={"name": "Dog2", "species": "Dog"})
    resp = await client.get("/api/v1/pets?species=Dog")
    assert resp.status_code == 200
    body = resp.json()
    assert body["pagination"]["total"] == 2
    assert all(p["species"] == "Dog" for p in body["data"])


async def test_list_pets_filter_status(client: AsyncClient):
    await client.post("/api/v1/pets", json={"name": "Active", "species": "Cat", "status": "Active"})
    await client.post("/api/v1/pets", json={"name": "Inactive", "species": "Cat", "status": "Inactive"})
    resp = await client.get("/api/v1/pets?status=Inactive")
    assert resp.status_code == 200
    body = resp.json()
    assert body["pagination"]["total"] == 1
    assert body["data"][0]["name"] == "Inactive"


async def test_list_pets_filter_by_owner(client: AsyncClient):
    owner = (await client.post("/api/v1/owners", json={"full_name": "Owner A"})).json()
    await client.post(
        "/api/v1/pets", json={"name": "Owner Pet", "species": "Dog", "owner_id": owner["id"]}
    )
    await client.post("/api/v1/pets", json={"name": "Stray", "species": "Dog"})
    resp = await client.get(f"/api/v1/pets?owner_id={owner['id']}")
    assert resp.status_code == 200
    assert resp.json()["pagination"]["total"] == 1


async def test_list_pets_search_by_name(client: AsyncClient):
    """Case-insensitive partial-match on name (FR-8.4)."""
    await client.post("/api/v1/pets", json={"name": "Maximus", "species": "Dog"})
    await client.post("/api/v1/pets", json={"name": "Whiskers", "species": "Cat"})
    resp = await client.get("/api/v1/pets?search=max")
    assert resp.status_code == 200
    assert resp.json()["pagination"]["total"] == 1
    assert resp.json()["data"][0]["name"] == "Maximus"


async def test_list_pets_search_by_breed(client: AsyncClient):
    """Case-insensitive partial-match on breed (FR-5)."""
    await client.post(
        "/api/v1/pets", json={"name": "Rex", "species": "Dog", "breed": "Labrador"}
    )
    await client.post(
        "/api/v1/pets", json={"name": "Mimi", "species": "Cat", "breed": "Siamese"}
    )
    resp = await client.get("/api/v1/pets?search=labra")
    assert resp.status_code == 200
    assert resp.json()["pagination"]["total"] == 1
    assert resp.json()["data"][0]["name"] == "Rex"


# ---------------------------------------------------------------------------
# CSV export
# ---------------------------------------------------------------------------

async def test_export_pets_csv_returns_csv_content_type(client: AsyncClient):
    await client.post("/api/v1/pets", json={"name": "CSV Bird", "species": "Bird"})
    resp = await client.get("/api/v1/pets/export/csv")
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]


async def test_export_pets_csv_contains_pet_data(client: AsyncClient):
    await client.post("/api/v1/pets", json={"name": "ExportMe", "species": "Rabbit"})
    resp = await client.get("/api/v1/pets/export/csv")
    assert "ExportMe" in resp.text


async def test_export_pets_csv_filtered_by_species(client: AsyncClient):
    """CSV export respects the same filter params as the list endpoint (NFR-5)."""
    await client.post("/api/v1/pets", json={"name": "Dog Export", "species": "Dog"})
    await client.post("/api/v1/pets", json={"name": "Cat Export", "species": "Cat"})
    resp = await client.get("/api/v1/pets/export/csv?species=Dog")
    assert resp.status_code == 200
    assert "Dog Export" in resp.text
    assert "Cat Export" not in resp.text
