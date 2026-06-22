"""Pet router — /api/v1/pets (architecture §3.5).

Route order matters: /export/csv is declared before /{pet_id} so FastAPI
does not interpret the literal string "export" as an integer path parameter.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.pet import Gender, PetStatus, Species
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.schemas.pet import PetCreate, PetListItem, PetResponse, PetUpdate
from app.services import pet_service

router = APIRouter(prefix="/pets", tags=["pets"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/export/csv", summary="Export filtered pets as CSV")
async def export_pets_csv(
    session: DbSession,
    species: Species | None = Query(default=None),
    status: PetStatus | None = Query(default=None),
    owner_id: int | None = Query(default=None),
    search: str | None = Query(default=None, max_length=200),
) -> Response:
    content = await pet_service.export_pets_csv(
        session, species=species, status=status, owner_id=owner_id, search=search
    )
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=pets.csv"},
    )


@router.get("", response_model=PaginatedResponse[PetListItem], summary="List / filter / search pets")
async def list_pets(
    session: DbSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    sort: str = Query(default="created_at", pattern="^(name|created_at)$"),
    order: str = Query(default="desc", pattern="^(asc|desc)$"),
    species: Species | None = Query(default=None),
    status: PetStatus | None = Query(default=None),
    owner_id: int | None = Query(default=None),
    search: str | None = Query(default=None, max_length=200),
) -> PaginatedResponse[PetListItem]:
    pets, total = await pet_service.list_pets(
        session,
        page=page,
        page_size=page_size,
        sort=sort,
        order=order,
        species=species,
        status=status,
        owner_id=owner_id,
        search=search,
    )
    total_pages = pet_service.pets_total_pages(total, page_size)
    return PaginatedResponse(
        data=[PetListItem.model_validate(p) for p in pets],
        pagination=PaginationMeta(page=page, page_size=page_size, total=total, total_pages=total_pages),
    )


@router.post("", response_model=PetResponse, status_code=201, summary="Create pet")
async def create_pet(session: DbSession, data: PetCreate) -> PetResponse:
    return await pet_service.create_pet(session, data)


@router.get("/{pet_id}", response_model=PetResponse, summary="Get pet by ID")
async def get_pet(session: DbSession, pet_id: int) -> PetResponse:
    return await pet_service.get_pet(session, pet_id)


@router.put("/{pet_id}", response_model=PetResponse, summary="Full update pet")
async def update_pet(session: DbSession, pet_id: int, data: PetUpdate) -> PetResponse:
    return await pet_service.update_pet(session, pet_id, data)


@router.delete("/{pet_id}", status_code=204, response_model=None, summary="Hard-delete pet")
async def delete_pet(session: DbSession, pet_id: int) -> None:
    await pet_service.delete_pet(session, pet_id)
