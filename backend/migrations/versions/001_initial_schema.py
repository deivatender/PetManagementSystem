"""initial_schema — create owners and pets tables

Creates both tables of the Pet Management System v1 data model in a single
revision, exactly as specified in the approved architecture (§2.1 / §2.2):
InnoDB, utf8mb4, the species/gender/status ENUMs, the nullable owner FK with
ON DELETE RESTRICT / ON UPDATE CASCADE, and every listed index.

Revision ID: 001
Revises:
Create Date: 2026-06-22
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Shared table options so both tables are created identically.
_TABLE_KW = {
    "mysql_engine": "InnoDB",
    "mysql_charset": "utf8mb4",
    "mysql_collate": "utf8mb4_unicode_ci",
}


def upgrade() -> None:
    # --- owners -------------------------------------------------------------
    op.create_table(
        "owners",
        sa.Column("id", mysql.INTEGER(unsigned=True), autoincrement=True, nullable=False),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("address", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        **_TABLE_KW,
    )
    op.create_index("uq_owners_email", "owners", ["email"], unique=True)
    op.create_index("idx_owners_name", "owners", ["full_name"], unique=False)
    op.create_index("idx_owners_phone", "owners", ["phone"], unique=False)

    # --- pets ---------------------------------------------------------------
    op.create_table(
        "pets",
        sa.Column("id", mysql.INTEGER(unsigned=True), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column(
            "species",
            mysql.ENUM("Dog", "Cat", "Bird", "Rabbit", "Reptile", "Other"),
            nullable=False,
        ),
        sa.Column("breed", sa.String(length=100), nullable=True),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column(
            "gender",
            mysql.ENUM("Male", "Female", "Unknown"),
            nullable=True,
        ),
        sa.Column(
            "status",
            mysql.ENUM("Active", "Inactive", "Deceased", "Rehomed"),
            server_default=sa.text("'Active'"),
            nullable=False,
        ),
        sa.Column("owner_id", mysql.INTEGER(unsigned=True), nullable=True),
        sa.Column(
            "created_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            mysql.DATETIME(fsp=6),
            server_default=sa.text("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["owner_id"],
            ["owners.id"],
            name="fk_pets_owner",
            ondelete="RESTRICT",
            onupdate="CASCADE",
        ),
        **_TABLE_KW,
    )
    op.create_index("idx_pets_owner_id", "pets", ["owner_id"], unique=False)
    op.create_index("idx_pets_name", "pets", ["name"], unique=False)
    op.create_index("idx_pets_breed", "pets", ["breed"], unique=False)
    op.create_index("idx_pets_species", "pets", ["species"], unique=False)
    op.create_index("idx_pets_status", "pets", ["status"], unique=False)


def downgrade() -> None:
    # Drop child table first to respect the FK dependency.
    op.drop_index("idx_pets_status", table_name="pets")
    op.drop_index("idx_pets_species", table_name="pets")
    op.drop_index("idx_pets_breed", table_name="pets")
    op.drop_index("idx_pets_name", table_name="pets")
    op.drop_index("idx_pets_owner_id", table_name="pets")
    op.drop_table("pets")

    op.drop_index("idx_owners_phone", table_name="owners")
    op.drop_index("idx_owners_name", table_name="owners")
    op.drop_index("uq_owners_email", table_name="owners")
    op.drop_table("owners")
