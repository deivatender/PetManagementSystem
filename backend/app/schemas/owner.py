"""Pydantic v2 schemas for Owner — request bodies and response shapes (architecture §3.4)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class OwnerCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=150)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, max_length=255)


# PUT is a full-replace update; required fields match OwnerCreate.
OwnerUpdate = OwnerCreate


class OwnerListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str | None
    phone: str | None
    address: str | None
    created_at: datetime
    updated_at: datetime


class OwnerResponse(OwnerListItem):
    """Single-resource response — includes derived pet_count (architecture §3.4)."""

    pet_count: int
