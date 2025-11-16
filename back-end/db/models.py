"""
SQLAlchemy ORM models for Bot Admin Panel
"""
from sqlalchemy import Column, String, Text, Boolean, DateTime, JSON, ForeignKey, BigInteger, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()


# ==================== PUBLIC SCHEMA MODELS ====================

class Role(Base):
    """Role model for public.roles table"""
    __tablename__ = "roles"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    permissions = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="role_obj")
    invitations = relationship("Invitation", back_populates="role_obj")


class Company(Base):
    """Company model for public.companies table"""
    __tablename__ = "companies"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    schema_name = Column(String, nullable=False, unique=True)
    active = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="company")
    invitations = relationship("Invitation", back_populates="company")
    bot_personalities = relationship("BotPersonality", back_populates="company")


class User(Base):
    """User model for public.users table"""
    __tablename__ = "users"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    password = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("public.companies.id"), nullable=False)
    invited_by = Column(UUID(as_uuid=True), ForeignKey("public.users.id"), nullable=True)
    role = Column(UUID(as_uuid=True), ForeignKey("public.roles.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="users")
    role_obj = relationship("Role", back_populates="users")
    invitations = relationship("Invitation", back_populates="invited_by_user")


class Invitation(Base):
    """Invitation model for public.invitations table"""
    __tablename__ = "invitations"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("public.companies.id"), nullable=False)
    invited_email = Column(String, nullable=False)
    invited_by = Column(UUID(as_uuid=True), ForeignKey("public.users.id"), nullable=False)
    token_hash = Column(String, nullable=False)
    role = Column(UUID(as_uuid=True), ForeignKey("public.roles.id"), nullable=False)
    status = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="invitations")
    invited_by_user = relationship("User", back_populates="invitations")
    role_obj = relationship("Role", back_populates="invitations")


class BotPersonality(Base):
    """Bot Personality model for public.bot_personality table"""
    __tablename__ = "bot_personality"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("public.companies.id"), nullable=False)
    bot_name = Column(String, nullable=True)
    bot_prompt = Column(Text, nullable=False)
    sample_response = Column(Text, nullable=True)
    length_of_response = Column(String, nullable=False)
    chatbot_tone = Column(String, nullable=False)
    prefered_lang = Column(String, nullable=False)
    use_emojis = Column(Boolean, nullable=False, default=True)
    use_bullet_points = Column(Boolean, nullable=False, default=True)

    # Relationships
    company = relationship("Company", back_populates="bot_personalities")


class Integration(Base):
    """Integration model for public.integrations table"""
    __tablename__ = "integrations"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("public.companies.id"), nullable=False)
    type = Column(String, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    phone_number = Column(String, nullable=False, unique=True)
    instance_name = Column(String, nullable=False, unique=True)
    phone_number_id = Column(String, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("public.users.id"), nullable=False)
    delete = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


# ==================== COMPANY SCHEMA MODELS ====================
# Note: These models are dynamically created per company schema
# The schema name is passed at runtime

class Conversation(Base):
    """Conversation model for {company_id}.conversations table"""
    __tablename__ = "conversations"

    conversation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_name = Column(String, nullable=False)
    ai_reply = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, default=datetime.utcnow)
    source = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    instance_name = Column(String, nullable=True)

    # Relationships
    messages = relationship("Message", back_populates="conversation")


class Message(Base):
    """Message model for {company_id}.messages table"""
    __tablename__ = "messages"

    message_id = Column(BigInteger, primary_key=True, autoincrement=True)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.conversation_id"), nullable=False)
    sender_type = Column(String, nullable=False)
    sender_email = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=True, default=datetime.utcnow)
    extra = Column(JSON, nullable=True)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")


class Image(Base):
    """Image model for {company_id}.images table"""
    __tablename__ = "images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_hash = Column(String, nullable=False)
    full_path = Column(String, nullable=False)
    status = Column(String, nullable=False)
    match_field = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class Document(Base):
    """Document model for {company_id}.documents table"""
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_hash = Column(String, nullable=False)
    full_path = Column(String, nullable=False)
    status = Column(String, nullable=False)
    match_field = Column(String, nullable=False)
    extra = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class Knowledge(Base):
    """Knowledge model for {company_id}.knowledges table"""
    __tablename__ = "knowledges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_hash = Column(String, nullable=False)
    full_path = Column(String, nullable=False)
    status = Column(String, nullable=False)
    primary_column = Column(String, nullable=False)
    extra = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

