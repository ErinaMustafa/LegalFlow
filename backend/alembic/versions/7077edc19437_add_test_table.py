"""add test table

Revision ID: 7077edc19437
Revises: 9d953e9cb91b
Create Date: 2026-05-24 17:23:41.215858

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '7077edc19437'
down_revision: Union[str, Sequence[str], None] = '9d953e9cb91b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table(
        'test_table',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_index(
        op.f('ix_test_table_id'),
        'test_table',
        ['id'],
        unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index(
        op.f('ix_test_table_id'),
        table_name='test_table'
    )

    op.drop_table('test_table')