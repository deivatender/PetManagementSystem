"""Pet business logic: CRUD, age computation, CSV export, pagination/sort/filter/search."""

from __future__ import annotations

import csv
import io
from math import ceil

from fastapi import HTTPException
from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.owner import Owner
from app.models.pet import Gender, Pet, PetStatus, Species
from app.schemas.pet import PetCreate, PetResponse, PetUpdate


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _sort_column(sort: str):
    mapping = {"name": Pet.name, "created_at": Pet.created_at}
    return mapping.get(sort, Pet.created_at)


def _order_fn(order: str):
    return asc if order == "asc" else desc


async def _assert_owner_exists(session: AsyncSession, owner_id: int) -> None:
    """Raise 422 if the owner_id does not reference a real owner (FR-3)."""
    owner = await session.get(Owner, owner_id)
    if owner is None:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed.",
                "details": [{"field": "owner_id", "message": "Owner does not exist."}],
            },
        )


async def _load_pet(session: AsyncSession, pet_id: int) -> Pet:
    """Load a pet with its owner relationship for single-resource responses."""
    stmt = select(Pet).options(selectinload(Pet.owner)).where(Pet.id == pet_id)
    pet = (await session.execute(stmt)).scalar_one_or_none()
    if pet is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Pet not found."},
        )
    return pet


def _to_response(pet: Pet) -> PetResponse:
    return PetResponse.model_validate(pet)


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

async def create_pet(session: AsyncSession, data: PetCreate) -> PetResponse:
    if data.owner_id is not None:
        await _assert_owner_exists(session, data.owner_id)

    pet = Pet(**data.model_dump())
    session.add(pet)
    await session.commit()
    # Reload with owner relationship.
    pet = await _load_pet(session, pet.id)
    return _to_response(pet)


async def get_pet(session: AsyncSession, pet_id: int) -> PetResponse:
    pet = await _load_pet(session, pet_id)
    return _to_response(pet)


async def update_pet(session: AsyncSession, pet_id: int, data: PetUpdate) -> PetResponse:
    pet = await session.get(Pet, pet_id)
    if pet is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Pet not found."},
        )
    if data.owner_id is not None:
        await _assert_owner_exists(session, data.owner_id)

    for field, value in data.model_dump().items():
        setattr(pet, field, value)
    await session.commit()
    pet = await _load_pet(session, pet_id)
    return _to_response(pet)


async def delete_pet(session: AsyncSession, pet_id: int) -> None:
    pet = await session.get(Pet, pet_id)
    if pet is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Pet not found."},
        )
    await session.delete(pet)
    await session.commit()


# ---------------------------------------------------------------------------
# List / filter / search
# ---------------------------------------------------------------------------

async def list_pets(
    session: AsyncSession,
    *,
    page: int = 1,
    page_size: int = 20,
    sort: str = "created_at",
    order: str = "desc",
    species: Species | None = None,
    status: PetStatus | None = None,
    owner_id: int | None = None,
    search: str | None = None,
) -> tuple[list[Pet], int]:
    stmt = select(Pet)

    if species is not None:
        stmt = stmt.where(Pet.species == species)
    if status is not None:
        stmt = stmt.where(Pet.status == status)
    if owner_id is not None:
        stmt = stmt.where(Pet.owner_id == owner_id)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(
            or_(Pet.name.ilike(like), Pet.breed.ilike(like))
        )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total: int = (await session.execute(count_stmt)).scalar_one()

    stmt = stmt.order_by(_order_fn(order)(_sort_column(sort)))
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    pets = (await session.execute(stmt)).scalars().all()
    return list(pets), total


# ---------------------------------------------------------------------------
# CSV export
# ---------------------------------------------------------------------------

async def export_pets_csv(
    session: AsyncSession,
    *,
    species: Species | None = None,
    status: PetStatus | None = None,
    owner_id: int | None = None,
    search: str | None = None,
) -> bytes:
    stmt = select(Pet)
    if species is not None:
        stmt = stmt.where(Pet.species == species)
    if status is not None:
        stmt = stmt.where(Pet.status == status)
    if owner_id is not None:
        stmt = stmt.where(Pet.owner_id == owner_id)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(or_(Pet.name.ilike(like), Pet.breed.ilike(like)))
    stmt = stmt.order_by(asc(Pet.name))
    pets = (await session.execute(stmt)).scalars().all()

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "id", "name", "species", "breed", "date_of_birth",
        "gender", "status", "owner_id", "created_at", "updated_at",
    ])
    for p in pets:
        writer.writerow([
            p.id,
            p.name,
            p.species.value,
            p.breed or "",
            p.date_of_birth.isoformat() if p.date_of_birth else "",
            p.gender.value if p.gender else "",
            p.status.value,
            p.owner_id or "",
            p.created_at.isoformat(),
            p.updated_at.isoformat(),
        ])
    return buf.getvalue().encode("utf-8")


def pets_total_pages(total: int, page_size: int) -> int:
    return ceil(total / page_size) if total > 0 else 1
