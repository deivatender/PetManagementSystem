"""Pet ORM model — maps the `pets` table (architecture §2.2).

`age` is intentionally NOT stored: it is computed downstream from
`date_of_birth` in the API response layer (ADR-2). Each pet references at most
one owner via a nullable FK with ``ON DELETE RESTRICT`` / ``ON UPDATE CASCADE``
(ADR-1).
"""

from __future__ import annotations

import enum
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, Enum, ForeignKey, Index, String, text
from sqlalchemy.dialects.mysql import DATETIME, INTEGER
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.owner import Owner


class Species(str, enum.Enum):
    """Controlled list of pet species (FR-1.3)."""

    DOG = "Dog"
    CAT = "Cat"
    BIRD = "Bird"
    RABBIT = "Rabbit"
    REPTILE = "Reptile"
    OTHER = "Other"


class Gender(str, enum.Enum):
    """Pet gender (FR-1.6)."""

    MALE = "Male"
    FEMALE = "Female"
    UNKNOWN = "Unknown"


class PetStatus(str, enum.Enum):
    """Lifecycle status; soft-delete is expressed through this field (FR-6)."""

    ACTIVE = "Active"
    INACTIVE = "Inactive"
    DECEASED = "Deceased"
    REHOMED = "Rehomed"


class Pet(Base):
    __tablename__ = "pets"

    id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True),
        primary_key=True,
        autoincrement=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    # native_enum=True -> a real MySQL ENUM column. values_callable stores the
    # human-readable string values ("Dog"), not the Python member names ("DOG").
    species: Mapped[Species] = mapped_column(
        Enum(
            Species,
            native_enum=True,
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
    )
    breed: Mapped[str | None] = mapped_column(String(100), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[Gender | None] = mapped_column(
        Enum(
            Gender,
            native_enum=True,
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=True,
    )
    status: Mapped[PetStatus] = mapped_column(
        Enum(
            PetStatus,
            native_enum=True,
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
        server_default=text("'Active'"),
    )
    owner_id: Mapped[int | None] = mapped_column(
        INTEGER(unsigned=True),
        ForeignKey(
            "owners.id",
            name="fk_pets_owner",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DATETIME(fsp=6),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP(6)"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DATETIME(fsp=6),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
    )

    owner: Mapped["Owner | None"] = relationship(back_populates="pets")

    __table_args__ = (
        Index("idx_pets_owner_id", "owner_id"),
        Index("idx_pets_name", "name"),
        Index("idx_pets_breed", "breed"),
        Index("idx_pets_species", "species"),
        Index("idx_pets_status", "status"),
        {
            "mysql_engine": "InnoDB",
            "mysql_charset": "utf8mb4",
            "mysql_collate": "utf8mb4_unicode_ci",
        },
    )

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<Pet id={self.id} name={self.name!r} species={self.species}>"
