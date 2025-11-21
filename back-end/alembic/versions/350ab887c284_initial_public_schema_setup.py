"""Initial public schema setup

Revision ID: 350ab887c284
Revises:
Create Date: 2025-11-20 08:28:28.861155

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '350ab887c284'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Create public schema tables, views, and default roles."""

    # Create roles table
    op.create_table(
        'roles',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('permissions', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        schema='public'
    )

    # Create companies table
    op.create_table(
        'companies',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('schema_name', sa.Text(), nullable=False, server_default=sa.text("''::text")),
        sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('delete', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('schema_name'),
        schema='public'
    )

    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('password', sa.Text(), nullable=False),
        sa.Column('email', sa.Text(), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('invited_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('role', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.ForeignKeyConstraint(['company_id'], ['public.companies.id']),
        sa.ForeignKeyConstraint(['role'], ['public.roles.id']),
        schema='public'
    )

    # Create invitations table
    op.create_table(
        'invitations',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('invited_email', sa.Text(), nullable=False),
        sa.Column('invited_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.Text(), nullable=False),
        sa.Column('token_hash', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['company_id'], ['public.companies.id']),
        sa.ForeignKeyConstraint(['invited_by'], ['public.users.id']),
        sa.ForeignKeyConstraint(['role'], ['public.roles.id']),
        schema='public'
    )

    # Create integrations table
    op.create_table(
        'integrations',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('phone_number', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('instance_name', sa.Text(), nullable=False),
        sa.Column('phone_number_id', sa.Text(), nullable=True),
        sa.Column('waba_id', sa.Text(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('delete', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('instance_name'),
        sa.UniqueConstraint('phone_number'),
        sa.ForeignKeyConstraint(['company_id'], ['public.companies.id']),
        sa.ForeignKeyConstraint(['created_by'], ['public.users.id']),
        sa.CheckConstraint("type = ANY (ARRAY['whatsapp_web'::text, 'whatsapp_api'::text])", name='integration_type_check'),
        schema='public'
    )

    # Create bot_personality table
    op.create_table(
        'bot_personality',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('bot_name', sa.Text(), nullable=True),
        sa.Column('bot_prompt', sa.Text(), nullable=False),
        sa.Column('sample_response', sa.Text(), nullable=True),
        sa.Column('length_of_response', sa.Text(), nullable=False),
        sa.Column('chatbot_tone', sa.Text(), nullable=False),
        sa.Column('prefered_lang', sa.Text(), nullable=False),
        sa.Column('use_emojis', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('use_bullet_points', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['company_id'], ['public.companies.id']),
        schema='public'
    )

    # Create views
    op.execute("""
        CREATE OR REPLACE VIEW public.users_with_permissions AS
        SELECT
            u.id as user_id,
            u.email,
            u.name,
            u.password,
            u.company_id,
            c.active,
            c.name as company_name,
            c.description as company_description,
            r.name as role_name,
            r.id as role_id,
            r.permissions
        FROM public.users u
        LEFT JOIN public.companies c ON c.id = u.company_id
        LEFT JOIN public.roles r ON r.id = u.role
        WHERE c.delete = false AND u.active = true
    """)

    op.execute("""
        CREATE OR REPLACE VIEW public.invitation_with_users AS
        SELECT
            i.id as id,
            i.company_id,
            c.name as company_name,
            i.invited_email,
            u.name as invited_by,
            i.token_hash,
            r.name as role,
            r.id as role_id,
            i.status,
            i.created_at
        FROM public.invitations i
        LEFT JOIN public.roles r ON i.role = r.id
        LEFT JOIN public.users u ON i.invited_by = u.id
        LEFT JOIN public.companies c ON c.id = i.company_id
        WHERE i.status != 'revoked'
    """)

    op.execute("""
        CREATE OR REPLACE VIEW public.integrations_with_users AS
        SELECT
            i.id,
            i.company_id,
            i.type,
            i.is_active,
            i.phone_number,
            i.phone_number_id,
            i.created_at,
            i.instance_name,
            i.created_by,
            i.delete,
            u.name as created_by_name
        FROM public.integrations i
        LEFT JOIN public.users u ON i.created_by = u.id
    """)

    # Insert default roles
    op.execute("""
        INSERT INTO public.roles (name, permissions)
        VALUES
            ('admin', '{"chat": true, "knowledge": true, "invite": true, "company": true, "integration": true, "conversation": true, "workflow": true}'::jsonb),
            ('knowledge_manager', '{"chat": false, "knowledge": true, "invite": false, "company": false, "integration": false, "conversation": false, "workflow": true}'::jsonb),
            ('agent', '{"chat": true, "knowledge": false, "invite": false, "company": false, "integration": true, "conversation": true, "workflow": false}'::jsonb)
        ON CONFLICT DO NOTHING
    """)


def downgrade() -> None:
    """Downgrade schema - Drop all public schema tables and views."""

    # Drop views
    op.execute("DROP VIEW IF EXISTS public.integrations_with_users")
    op.execute("DROP VIEW IF EXISTS public.invitation_with_users")
    op.execute("DROP VIEW IF EXISTS public.users_with_permissions")

    # Drop tables (in reverse order of creation due to foreign keys)
    op.drop_table('bot_personality', schema='public')
    op.drop_table('integrations', schema='public')
    op.drop_table('invitations', schema='public')
    op.drop_table('users', schema='public')
    op.drop_table('companies', schema='public')
    op.drop_table('roles', schema='public')
