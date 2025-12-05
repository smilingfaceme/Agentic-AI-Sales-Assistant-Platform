"""
SQLAlchemy-based database functions for public schema tables
"""
from db.db_connection import db
from db.company_table import create_company_tables
from db.models import Company, User, Role, Invitation, BotPersonality, Integration
from sqlalchemy import and_
import time
from uuid import UUID


# ==================== COMPANIES ====================

def get_companies(key: str, value):
    """Get a company by a specific key-value pair"""
    session = db.get_session()
    try:
        # Build dynamic query
        filter_kwargs = {key: value}
        company = session.query(Company).filter_by(**filter_kwargs).first()
        if company:
            return {
                'id': str(company.id),
                'name': company.name,
                'description': company.description,
                'schema_name': company.schema_name,
                'active': company.active,
                'created_at': company.created_at.isoformat() if company.created_at else None
            }
        return None
    except Exception as e:
        print(f"Error getting company: {e}")
        return None
    finally:
        session.close()


def create_companies(name: str, description: str):
    """Create a new company"""
    company_schema_name = f"company_{str(time.time()).replace('.', '')}"
    session = db.get_session()
    try:
        # Create company record
        new_company = Company(
            name=name,
            description=description,
            schema_name=company_schema_name,
            active=True
        )
        session.add(new_company)
        session.commit()
        session.refresh(new_company)

        company_dict = {
            'id': str(new_company.id),
            'name': new_company.name,
            'description': new_company.description,
            'schema_name': new_company.schema_name,
            'active': new_company.active,
            'created_at': new_company.created_at.isoformat() if new_company.created_at else None
        }

        # Create company schema and tables
        add_chatbot_personality(str(new_company.id), "You are an AI sales assistant helping customers. Generate short, natural, clear sales replies.")
        create_company_tables(company_schema_name)

        return company_dict
    except Exception as e:
        session.rollback()
        print(f"Error creating company: {e}")
        return None
    finally:
        session.close()


def update_company_by_id(id: str, data: dict):
    """Update a company by ID"""
    session = db.get_session()
    try:
        company = session.query(Company).filter_by(id=UUID(id)).first()
        if not company:
            return None

        # Update fields
        for key, value in data.items():
            if hasattr(company, key):
                setattr(company, key, value)

        session.commit()
        session.refresh(company)

        return {
            'id': str(company.id),
            'name': company.name,
            'description': company.description,
            'schema_name': company.schema_name,
            'active': company.active,
            'created_at': company.created_at.isoformat() if company.created_at else None
        }
    except Exception as e:
        session.rollback()
        print(f"Error updating company: {e}")
        return None
    finally:
        session.close()


# ==================== ROLES ====================

def get_roles(key: str = None, value=None):
    """Get roles - all roles if no key provided, or filtered by key-value"""
    session = db.get_session()
    try:
        if key:
            filter_kwargs = {key: value}
            role = session.query(Role).filter_by(**filter_kwargs).first()
            if role:
                return {
                    'id': str(role.id),
                    'name': role.name,
                    'permissions': role.permissions,
                    'created_at': role.created_at.isoformat() if role.created_at else None
                }
        else:
            roles = session.query(Role).all()
            return [
                {
                    'id': str(role.id),
                    'name': role.name,
                    'permissions': role.permissions,
                    'created_at': role.created_at.isoformat() if role.created_at else None
                }
                for role in roles
            ]
        return None
    except Exception as e:
        print(f"Error getting roles: {e}")
        return None
    finally:
        session.close()


# ==================== USERS ====================

def get_user_with_permission(key: str, value):
    """Get user with permissions by joining users, companies, and roles tables"""
    session = db.get_session()
    try:
        # Build dynamic filter based on key
        if key == 'user_id':
            filter_condition = User.id == value
        elif key == 'email':
            filter_condition = User.email == value
        else:
            filter_condition = getattr(User, key) == value

        # Query with JOINs to replicate the view:
        # users u LEFT JOIN companies c ON c.id = u.company_id
        # LEFT JOIN roles r ON r.id = u.role
        # WHERE c.delete = false AND u.active = true
        result = session.query(
            User.id.label('user_id'),
            User.email,
            User.name,
            User.password,
            User.company_id,
            Company.active,
            Company.name.label('company_name'),
            Company.description.label('company_description'),
            Role.name.label('role_name'),
            Role.id.label('role_id'),
            Role.permissions
        ).outerjoin(
            Company, Company.id == User.company_id
        ).outerjoin(
            Role, Role.id == User.role
        ).filter(
            and_(
                Company.delete == False,
                User.active == True,
                filter_condition
            )
        ).first()

        if result:
            return {
                'user_id': str(result.user_id),
                'email': result.email,
                'name': result.name,
                'password': result.password,
                'company_id': str(result.company_id) if result.company_id else None,
                'active': result.active,
                'company_name': result.company_name,
                'company_description': result.company_description,
                'role_name': result.role_name,
                'role_id': str(result.role_id) if result.role_id else None,
                'permissions': result.permissions
            }
        return None
    except Exception as e:
        print(f"Error getting user with permission: {e}")
        return None
    finally:
        session.close()


def get_users(key: str, value):
    """Get a user by key-value pair"""
    session = db.get_session()
    try:
        filter_kwargs = {key: value}
        user = session.query(User).filter_by(**filter_kwargs).first()
        if user:
            return {
                'id': str(user.id),
                'name': user.name,
                'email': user.email,
                'company_id': str(user.company_id),
                'invited_by': str(user.invited_by) if user.invited_by else None,
                'role': str(user.role),
                'active': user.active,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        return None
    except Exception as e:
        print(f"Error getting user: {e}")
        return None
    finally:
        session.close()


def add_new_user(name: str, email: str, password: str, company_id: str, role: str, invited_by: str = ""):
    """Add a new user"""
    session = db.get_session()
    try:
        new_user = User(
            name=name,
            email=email,
            password=password,
            company_id=UUID(company_id),
            role=UUID(role),
            invited_by=UUID(invited_by) if invited_by else None
        )
        session.add(new_user)
        session.commit()
        session.refresh(new_user)

        return {
            'id': str(new_user.id),
            'name': new_user.name,
            'email': new_user.email,
            'company_id': str(new_user.company_id),
            'invited_by': str(new_user.invited_by) if new_user.invited_by else None,
            'role': str(new_user.role),
            'created_at': new_user.created_at.isoformat() if new_user.created_at else None
        }
    except Exception as e:
        session.rollback()
        print(f"Error adding user: {e}")
        return None
    finally:
        session.close()


def update_user_by_id(id: str, data: dict):
    """Update a user by ID"""
    session = db.get_session()
    try:
        user = session.query(User).filter_by(id=UUID(id)).first()
        if not user:
            return None

        for key, value in data.items():
            if hasattr(user, key):
                setattr(user, key, value)

        session.commit()
        session.refresh(user)

        return {
            'id': str(user.id),
            'name': user.name,
            'email': user.email,
            'company_id': str(user.company_id),
            'invited_by': str(user.invited_by) if user.invited_by else None,
            'role': str(user.role),
            'created_at': user.created_at.isoformat() if user.created_at else None
        }
    except Exception as e:
        session.rollback()
        print(f"Error updating user: {e}")
        return None
    finally:
        session.close()


def get_users_by_role(role_name: str, company_id: str):
    """Get all users by role name for a specific company"""
    session = db.get_session()
    try:
        # First get the role ID by role name
        role = session.query(Role).filter_by(name=role_name).first()
        if not role:
            return []

        # Query users with the role ID and company ID, only active users
        users = session.query(User).filter(
            and_(
                User.role == role.id,
                User.company_id == UUID(company_id),
                User.active == True
            )
        ).all()

        if users:
            return [
                {
                    'id': str(user.id),
                    'name': user.name,
                    'email': user.email,
                    'company_id': str(user.company_id),
                    'invited_by': str(user.invited_by) if user.invited_by else None,
                    'role': str(user.role),
                    'active': user.active,
                    'created_at': user.created_at.isoformat() if user.created_at else None
                }
                for user in users
            ]
        return []
    except Exception as e:
        print(f"Error getting users by role: {e}")
        return []
    finally:
        session.close()


# ==================== INVITATIONS ====================

def get_invitations_with_users(key: str, value):
    """Get invitations with user details by joining invitations, roles, users, and companies tables"""
    session = db.get_session()
    try:
        # Build dynamic filter based on key
        if key == 'company_id':
            filter_condition = Invitation.company_id == value
        elif key == 'id':
            filter_condition = Invitation.id == value
        else:
            filter_condition = getattr(Invitation, key) == value

        # Create an alias for User to get invited_by user's name
        from sqlalchemy.orm import aliased
        InvitedByUser = aliased(User)

        # Query with JOINs to replicate the view:
        # invitations i LEFT JOIN roles r ON i.role = r.id
        # LEFT JOIN users u ON i.invited_by = u.id
        # LEFT JOIN companies c ON c.id = i.company_id
        # WHERE i.status != 'revoked'
        results = session.query(
            Invitation.id,
            Invitation.company_id,
            Company.name.label('company_name'),
            Invitation.invited_email,
            InvitedByUser.name.label('invited_by'),
            Invitation.token_hash,
            Role.name.label('role'),
            Role.id.label('role_id'),
            Invitation.status,
            Invitation.created_at
        ).outerjoin(
            Role, Invitation.role == Role.id
        ).outerjoin(
            InvitedByUser, Invitation.invited_by == InvitedByUser.id
        ).outerjoin(
            Company, Company.id == Invitation.company_id
        ).filter(
            and_(
                Invitation.status != 'revoked',
                filter_condition
            )
        ).all()

        if results:
            result_list = []
            for row in results:
                result_list.append({
                    'id': str(row.id),
                    'company_id': str(row.company_id) if row.company_id else None,
                    'company_name': row.company_name,
                    'invited_email': row.invited_email,
                    'invited_by': row.invited_by,
                    'token_hash': row.token_hash,
                    'role': row.role,
                    'role_id': str(row.role_id) if row.role_id else None,
                    'status': row.status,
                    'created_at': row.created_at.isoformat() if row.created_at else None
                })
            return result_list
        return None
    except Exception as e:
        print(f"Error getting invitations with users: {e}")
        return None
    finally:
        session.close()


def get_invitations(key: str, value):
    """Get invitations by key-value pair"""
    session = db.get_session()
    try:
        filter_kwargs = {key: value}
        invitations = session.query(Invitation).filter_by(**filter_kwargs).all()
        if invitations:
            return [
                {
                    'id': str(inv.id),
                    'company_id': str(inv.company_id),
                    'invited_email': inv.invited_email,
                    'invited_by': str(inv.invited_by),
                    'token_hash': inv.token_hash,
                    'role': str(inv.role),
                    'status': inv.status,
                    'created_at': inv.created_at.isoformat() if inv.created_at else None
                }
                for inv in invitations
            ]
        return None
    except Exception as e:
        print(f"Error getting invitations: {e}")
        return None
    finally:
        session.close()


def add_invitation(email: str, company_id: str, role: str, token_hash: str, invited_by: str):
    """Add a new invitation"""
    session = db.get_session()
    try:
        new_invitation = Invitation(
            company_id=UUID(company_id),
            invited_email=email,
            invited_by=UUID(invited_by),
            token_hash=token_hash,
            role=UUID(role),
            status="pending"
        )
        session.add(new_invitation)
        session.commit()
        session.refresh(new_invitation)

        return {
            'id': str(new_invitation.id),
            'company_id': str(new_invitation.company_id),
            'invited_email': new_invitation.invited_email,
            'invited_by': str(new_invitation.invited_by),
            'token_hash': new_invitation.token_hash,
            'role': str(new_invitation.role),
            'status': new_invitation.status,
            'created_at': new_invitation.created_at.isoformat() if new_invitation.created_at else None
        }
    except Exception as e:
        session.rollback()
        print(f"Error adding invitation: {e}")
        return None
    finally:
        session.close()


def update_invitation_by_id(id: str, data: dict):
    """Update an invitation by ID"""
    session = db.get_session()
    try:
        invitation = session.query(Invitation).filter_by(id=UUID(id)).first()
        if not invitation:
            return None

        for key, value in data.items():
            if hasattr(invitation, key):
                setattr(invitation, key, value)

        session.commit()
        session.refresh(invitation)

        return {
            'id': str(invitation.id),
            'company_id': str(invitation.company_id),
            'invited_email': invitation.invited_email,
            'invited_by': str(invitation.invited_by),
            'token_hash': invitation.token_hash,
            'role': str(invitation.role),
            'status': invitation.status,
            'created_at': invitation.created_at.isoformat() if invitation.created_at else None
        }
    except Exception as e:
        session.rollback()
        print(f"Error updating invitation: {e}")
        return None
    finally:
        session.close()


# ==================== BOT PERSONALITY ====================

def add_chatbot_personality(company_id: str, bot_prompt: str):
    """Add chatbot personality for a company"""
    session = db.get_session()
    try:
        new_personality = BotPersonality(
            company_id=UUID(company_id),
            bot_prompt=bot_prompt,
            length_of_response='Medium',
            chatbot_tone='Neutral',
            prefered_lang='None'
        )
        session.add(new_personality)
        session.commit()
        session.refresh(new_personality)

        return {
            'id': str(new_personality.id),
            'company_id': str(new_personality.company_id),
            'bot_name': new_personality.bot_name,
            'bot_prompt': new_personality.bot_prompt,
            'sample_response': new_personality.sample_response,
            'length_of_response': new_personality.length_of_response,
            'chatbot_tone': new_personality.chatbot_tone,
            'prefered_lang': new_personality.prefered_lang,
            'use_emojis': new_personality.use_emojis,
            'use_bullet_points': new_personality.use_bullet_points
        }
    except Exception as e:
        session.rollback()
        print(f"Error adding chatbot personality: {e}")
        return None
    finally:
        session.close()


def update_chatbot_personality_by_id(company_id: str, data: dict):
    """Update chatbot personality by company ID"""
    session = db.get_session()
    try:
        personality = session.query(BotPersonality).filter_by(company_id=UUID(company_id)).first()
        if not personality:
            return None

        for key, value in data.items():
            if hasattr(personality, key):
                setattr(personality, key, value)

        session.commit()
        session.refresh(personality)

        return {
            'id': str(personality.id),
            'company_id': str(personality.company_id),
            'bot_name': personality.bot_name,
            'bot_prompt': personality.bot_prompt,
            'sample_response': personality.sample_response,
            'length_of_response': personality.length_of_response,
            'chatbot_tone': personality.chatbot_tone,
            'prefered_lang': personality.prefered_lang,
            'use_emojis': personality.use_emojis,
            'use_bullet_points': personality.use_bullet_points
        }
    except Exception as e:
        session.rollback()
        print(f"Error updating chatbot personality: {e}")
        return None
    finally:
        session.close()


def get_chatbot_personality(company_id: str):
    """Get chatbot personality by company ID"""
    session = db.get_session()
    try:
        personality = session.query(BotPersonality).filter_by(company_id=UUID(company_id)).first()
        if personality:
            return {
                'id': str(personality.id),
                'company_id': str(personality.company_id),
                'bot_name': personality.bot_name,
                'bot_prompt': personality.bot_prompt,
                'sample_response': personality.sample_response,
                'length_of_response': personality.length_of_response,
                'chatbot_tone': personality.chatbot_tone,
                'prefered_lang': personality.prefered_lang,
                'use_emojis': personality.use_emojis,
                'use_bullet_points': personality.use_bullet_points
            }
        return None
    except Exception as e:
        print(f"Error getting chatbot personality: {e}")
        return None
    finally:
        session.close()


# ==================== INTEGRATIONS ====================

def get_integrations(filters: dict):
    """Get integrations by multiple filter criteria"""
    session = db.get_session()
    try:
        query = session.query(Integration).join(User, Integration.created_by == User.id)

        # Apply filters
        for key, value in filters.items():
            if hasattr(Integration, key):
                if key == "company_id":
                    query = query.filter(Integration.company_id == UUID(value))
                else:
                    query = query.filter(getattr(Integration, key) == value)

        integrations = query.order_by(Integration.created_at).all()
        if integrations:
            return [
                {
                    'id': str(integration.id),
                    'company_id': str(integration.company_id),
                    'type': integration.type,
                    'is_active': integration.is_active,
                    'phone_number': integration.phone_number,
                    'phone_number_id': integration.phone_number_id,
                    'waba_id': integration.waba_id,
                    'instance_name': integration.instance_name,
                    'created_by': str(integration.created_by),
                    'created_by_name': integration.integrated_user.name,
                    'created_by_email': integration.integrated_user.email,
                    'delete': integration.delete,
                    'created_at': integration.created_at.isoformat() if integration.created_at else None
                }
                for integration in integrations
            ]
        return None
    except Exception as e:
        print(f"Error getting integrations: {e}")
        return None
    finally:
        session.close()


def add_new_integration(company_id: str, created_by: str, instance_name: str, phone_number: str, type: str = "whatsapp_web", phone_number_id:str = None, waba_id:str = None):
    """Add a new integration"""
    session = db.get_session()
    try:
        new_integration = Integration(
            company_id=UUID(company_id),
            created_by=UUID(created_by),
            instance_name=instance_name,
            phone_number=phone_number,
            type=type,
            is_active=True,
            delete=False,
            phone_number_id = phone_number_id,
            waba_id=waba_id
        )
        session.add(new_integration)
        session.commit()
        session.refresh(new_integration)

        return {
            'id': str(new_integration.id),
            'company_id': str(new_integration.company_id),
            'type': new_integration.type,
            'is_active': new_integration.is_active,
            'phone_number': new_integration.phone_number,
            'instance_name': new_integration.instance_name,
            'created_by': str(new_integration.created_by),
            'delete': new_integration.delete,
            'phone_number_id': new_integration.phone_number_id,
            'waba_id': new_integration.waba_id,
            'created_at': new_integration.created_at.isoformat() if new_integration.created_at else None
        }
    except Exception as e:
        session.rollback()
        print(f"Error adding integration: {e}")
        return None
    finally:
        session.close()


def update_integration_by_id(id: str, data: dict):
    """Update an integration by ID"""
    session = db.get_session()
    try:
        integration = session.query(Integration).filter_by(id=UUID(id)).first()
        if not integration:
            return None

        for key, value in data.items():
            if hasattr(integration, key):
                setattr(integration, key, value)

        session.commit()
        session.refresh(integration)

        return {
            'id': str(integration.id),
            'company_id': str(integration.company_id),
            'type': integration.type,
            'is_active': integration.is_active,
            'phone_number': integration.phone_number,
            'instance_name': integration.instance_name,
            'created_by': str(integration.created_by),
            'delete': integration.delete,
            'created_at': integration.created_at.isoformat() if integration.created_at else None
        }
    except Exception as e:
        session.rollback()
        print(f"Error updating integration: {e}")
        return None
    finally:
        session.close()

def get_integration_by_instance_name(instance_name: str):
    """Get an integration by instance name"""
    session = db.get_session()
    try:
        integration = session.query(Integration).filter_by(instance_name=instance_name).first()
        if integration:
            return {
                'id': str(integration.id),
                'company_id': str(integration.company_id),
                'type': integration.type,
                'is_active': integration.is_active,
                'phone_number': integration.phone_number,
                'instance_name': integration.instance_name,
                'created_by': str(integration.created_by),
                'delete': integration.delete,
                'phone_number_id': integration.phone_number_id,
                'created_at': integration.created_at.isoformat() if integration.created_at else None
            }
        return {}
    except Exception as e:
        print(f"Error getting integration: {e}")
        return {}
    finally:
        session.close()


def get_integration_by_phone_number_id(phone_number_id: str):
    """Get an integration by phone_number_id"""
    session = db.get_session()
    try:
        integration = session.query(Integration).filter_by(phone_number_id=phone_number_id, delete=False).first()
        if integration:
            return {
                'id': str(integration.id),
                'company_id': str(integration.company_id),
                'type': integration.type,
                'is_active': integration.is_active,
                'phone_number': integration.phone_number,
                'instance_name': integration.instance_name,
                'created_by': str(integration.created_by),
                'delete': integration.delete,
                'phone_number_id': integration.phone_number_id,
                'created_at': integration.created_at.isoformat() if integration.created_at else None
            }
        return {}
    except Exception as e:
        print(f"Error getting integration by phone_number_id: {e}")
        return {}
    finally:
        session.close()