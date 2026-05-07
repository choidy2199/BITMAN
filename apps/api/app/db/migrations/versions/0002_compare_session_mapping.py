"""compare_sessions: store sheet_name, header_row, mapping for merge reuse

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-07
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: Union[str, Sequence[str], None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("compare_sessions", sa.Column("sheet_name", sa.String(120), nullable=True))
    op.add_column(
        "compare_sessions",
        sa.Column("header_row", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column("compare_sessions", sa.Column("mapping", postgresql.JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column("compare_sessions", "mapping")
    op.drop_column("compare_sessions", "header_row")
    op.drop_column("compare_sessions", "sheet_name")
