"""Pydantic v2 schemas for Pet — request bodies and response shapes (architecture §3.4).

`age` is a @computed_field derived from `date_of_birth` at serialisation time (ADR-2).
"""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, computed_field, model_validator

from app.models.pet import Gender, PetStatus, Species


class OwnerSummary(BaseModel):
    """Lightweight owner embed included only in single-pet responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str


class PetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    species: Species
    breed: str | None = Field(default=None, max_length=100)
    date_of_birth: date | None = None
    gender: Gender | None = None
    status: PetStatus = PetStatus.ACTIVE
    owner_id: int | None = None

    @model_validator(mode="after")
    def dob_not_in_future(self) -> "PetCreate":
        if self.date_of_birth is not None and self.date_of_birth > date.today():
            raise ValueError("date_of_birth must not be in the future")
        return self


# PUT is a full-replace update; required fields match PetCreate.
PetUpdate = PetCreate


class PetListItem(BaseModel):
    """List-item shape — no inline owner object; age is included for convenience."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    species: Species
    breed: str | None
    date_of_birth: date | None
    gender: Gender | None
    status: PetStatus
    owner_id: int | None
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def age(self) -> int | None:
        if self.date_of_birth is None:
            return None
        today = date.today()
        return today.year - self.date_of_birth.year - int(
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )


class PetResponse(PetListItem):
    """Single-resource response — includes inline owner summary."""

    owner: OwnerSummary | None = None
