"""Owner router — /api/v1/owners (architecture §3.5).

Route order matters: /export/csv is declared before /{owner_id} so FastAPI
does not interpret the literal string "export" as an integer path parameter.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.owner import Owner
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.schemas.owner import OwnerCreate, OwnerListItem, OwnerResponse, OwnerUpdate
from app.services import owner_service

router = APIRouter(prefix="/owners", tags=["owners"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/export/csv", summary="Export filtered owners as CSV")
async def export_owners_csv(
    session: DbSession,
    search: str | None = Query(default=None, max_length=200),
) -> Response:
    content = await owner_service.export_owners_csv(session, search=search)
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=owners.csv"},
    )


@router.get("", response_model=PaginatedResponse[OwnerListItem], summary="List / search owners")
async def list_owners(
    session: DbSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    sort: str = Query(default="created_at", pattern="^(full_name|created_at)$"),
    order: str = Query(default="desc", pattern="^(asc|desc)$"),
    search: str | None = Query(default=None, max_length=200),
) -> PaginatedResponse[OwnerListItem]:
    owners, total = await owner_service.list_owners(
        session, page=page, page_size=page_size, sort=sort, order=order, search=search
    )
    total_pages = owner_service.owners_total_pages(total, page_size)
    return PaginatedResponse(
        data=[OwnerListItem.model_validate(o) for o in owners],
        pagination=PaginationMeta(page=page, page_size=page_size, total=total, total_pages=total_pages),
    )


@router.post("", response_model=OwnerResponse, status_code=201, summary="Create owner")
async def create_owner(session: DbSession, data: OwnerCreate) -> OwnerResponse:
    return await owner_service.create_owner(session, data)


@router.get("/{owner_id}", response_model=OwnerResponse, summary="Get owner by ID")
async def get_owner(session: DbSession, owner_id: int) -> OwnerResponse:
    return await owner_service.get_owner(session, owner_id)


@router.put("/{owner_id}", response_model=OwnerResponse, summary="Full update owner")
async def update_owner(session: DbSession, owner_id: int, data: OwnerUpdate) -> OwnerResponse:
    return await owner_service.update_owner(session, owner_id, data)


@router.delete("/{owner_id}", status_code=204, response_model=None, summary="Delete owner")
async def delete_owner(session: DbSession, owner_id: int) -> None:
    await owner_service.delete_owner(session, owner_id)
