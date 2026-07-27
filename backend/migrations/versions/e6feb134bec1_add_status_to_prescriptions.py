"""add status to prescriptions

Revision ID: e6feb134bec1
Revises: 88dc30b58751
Create Date: 2026-07-26 12:59:23.954158

"""
from alembic import op
import sqlalchemy as sa


revision = 'e6feb134bec1'
down_revision = '88dc30b58751'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('prescriptions', schema=None) as batch_op:
        batch_op.add_column(sa.Column('status', sa.String(length=20), nullable=False, server_default='Pending'))


def downgrade():
    with op.batch_alter_table('prescriptions', schema=None) as batch_op:
        batch_op.drop_column('status')
