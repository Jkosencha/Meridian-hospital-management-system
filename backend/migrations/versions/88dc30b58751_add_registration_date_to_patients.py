"""add registration_date to patients

Revision ID: 88dc30b58751
Revises: 2450e3cef261
Create Date: 2026-07-23 19:07:12.747606

"""
from alembic import op
import sqlalchemy as sa


revision = '88dc30b58751'
down_revision = '2450e3cef261'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('patients', schema=None) as batch_op:
        batch_op.add_column(sa.Column('registration_date', sa.Date(), nullable=True))


def downgrade():
    with op.batch_alter_table('patients', schema=None) as batch_op:
        batch_op.drop_column('registration_date')
