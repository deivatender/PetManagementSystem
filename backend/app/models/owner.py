"""Owner ORM model — maps the `owners` table (architecture §2.1).

One Owner has many Pets (FR-3). The relationship to Pet uses
``passive_deletes='all'`` so SQLAlchemy never tries to null-out or cascade the
child rows itself — the database FK (``ON DELETE RESTRICT``) is the single
authority for delete behaviour, and the service layer surfaces the resulting
IntegrityError as HTTP 409 (FR-7, ADR-1).
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Index, String, text
from sqlalchemy.dialects.mysql import DATETIME, INTEGER
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.pet import Pet


class Owner(Base):
    __tablename__ = "owners"

    id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True),
        primary_key=True,
        autoincrement=True,
    )
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    # email is UNIQUE-when-present: NULLs are allowed to repeat under a MySQL
    # UNIQUE index, which satisfies "unique if present" without extra logic.
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DATETIME(fsp=6),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP(6)"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DATETIME(fsp=6),
        nullable=False,
        # The ON UPDATE clause is emitted in the DDL so MySQL maintains
        # updated_at on every row change without application involvement.
        server_default=text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
    )

    pets: Mapped[list["Pet"]] = relationship(
        back_populates="owner",
        passive_deletes="all",
    )

    __table_args__ = (
        Index("uq_owners_email", "email", unique=True),
        Index("idx_owners_name", "full_name"),
        Index("idx_owners_phone", "phone"),
        {
            "mysql_engine": "InnoDB",
            "mysql_charset": "utf8mb4",
            "mysql_collate": "utf8mb4_unicode_ci",
        },
    )

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<Owner id={self.id} full_name={self.full_name!r}>"
