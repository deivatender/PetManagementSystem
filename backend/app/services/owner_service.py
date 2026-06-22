"""Owner business logic: CRUD, delete guard, CSV export, pagination/sort/search."""

from __future__ import annotations

import csv
import io
from math import ceil

from fastapi import HTTPException
from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.owner import Owner
from app.models.pet import Pet
from app.schemas.owner import OwnerCreate, OwnerResponse, OwnerUpdate


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _sort_column(sort: str):
    mapping = {"full_name": Owner.full_name, "created_at": Owner.created_at}
    return mapping.get(sort, Owner.created_at)


def _order_fn(order: str):
    return asc if order == "asc" else desc


async def _pet_count(session: AsyncSession, owner_id: int) -> int:
    result = await session.execute(
        select(func.count(Pet.id)).where(Pet.owner_id == owner_id)
    )
    return result.scalar_one()


async def _to_response(session: AsyncSession, owner: Owner) -> OwnerResponse:
    count = await _pet_count(session, owner.id)
    return OwnerResponse(
        id=owner.id,
        full_name=owner.full_name,
        email=owner.email,
        phone=owner.phone,
        address=owner.address,
        pet_count=count,
        created_at=owner.created_at,
        updated_at=owner.updated_at,
    )


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

async def create_owner(session: AsyncSession, data: OwnerCreate) -> OwnerResponse:
    owner = Owner(**data.model_dump())
    session.add(owner)
    try:
        await session.commit()
        await session.refresh(owner)
    except IntegrityError as exc:
        await session.rollback()
        # The only UNIQUE constraint on owners is email — any IntegrityError here
        # is a duplicate-email violation (MySQL: "Duplicate entry", SQLite: "UNIQUE constraint failed").
        raise HTTPException(
            status_code=409,
            detail={"code": "CONFLICT", "message": "An owner with this email already exists."},
        ) from exc
    return await _to_response(session, owner)


async def get_owner(session: AsyncSession, owner_id: int) -> OwnerResponse:
    owner = await session.get(Owner, owner_id)
    if owner is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Owner not found."},
        )
    return await _to_response(session, owner)


async def update_owner(session: AsyncSession, owner_id: int, data: OwnerUpdate) -> OwnerResponse:
    owner = await session.get(Owner, owner_id)
    if owner is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Owner not found."},
        )
    for field, value in data.model_dump().items():
        setattr(owner, field, value)
    try:
        await session.commit()
        await session.refresh(owner)
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=409,
            detail={"code": "CONFLICT", "message": "An owner with this email already exists."},
        ) from exc
    return await _to_response(session, owner)


async def delete_owner(session: AsyncSession, owner_id: int) -> None:
    owner = await session.get(Owner, owner_id)
    if owner is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Owner not found."},
        )
    # Application-level delete guard (FR-7) — checked before the DELETE so the
    # error is deterministic across all DB backends (the DB FK RESTRICT is a
    # second line of defence against race conditions in MySQL).
    if await _pet_count(session, owner_id) > 0:
        raise HTTPException(
            status_code=409,
            detail={"code": "CONFLICT", "message": "Cannot delete owner: one or more pets are assigned to this owner."},
        )
    await session.delete(owner)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=409,
            detail={"code": "CONFLICT", "message": "Cannot delete owner: one or more pets are assigned to this owner."},
        ) from exc


# ---------------------------------------------------------------------------
# List / search
# ---------------------------------------------------------------------------

async def list_owners(
    session: AsyncSession,
    *,
    page: int = 1,
    page_size: int = 20,
    sort: str = "created_at",
    order: str = "desc",
    search: str | None = None,
) -> tuple[list[Owner], int]:
    stmt = select(Owner)

    if search:
        like = f"%{search}%"
        stmt = stmt.where(
            or_(
                Owner.full_name.ilike(like),
                Owner.email.ilike(like),
                Owner.phone.ilike(like),
            )
        )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total: int = (await session.execute(count_stmt)).scalar_one()

    stmt = stmt.order_by(_order_fn(order)(_sort_column(sort)))
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    owners = (await session.execute(stmt)).scalars().all()
    return list(owners), total


# ---------------------------------------------------------------------------
# CSV export
# ---------------------------------------------------------------------------

async def export_owners_csv(
    session: AsyncSession,
    *,
    search: str | None = None,
) -> bytes:
    stmt = select(Owner)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(
            or_(
                Owner.full_name.ilike(like),
                Owner.email.ilike(like),
                Owner.phone.ilike(like),
            )
        )
    stmt = stmt.order_by(asc(Owner.full_name))
    owners = (await session.execute(stmt)).scalars().all()

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "full_name", "email", "phone", "address", "created_at", "updated_at"])
    for o in owners:
        writer.writerow([
            o.id,
            o.full_name,
            o.email or "",
            o.phone or "",
            o.address or "",
            o.created_at.isoformat(),
            o.updated_at.isoformat(),
        ])
    return buf.getvalue().encode("utf-8")


def owners_total_pages(total: int, page_size: int) -> int:
    return ceil(total / page_size) if total > 0 else 1
