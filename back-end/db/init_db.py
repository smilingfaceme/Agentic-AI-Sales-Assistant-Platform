"""
Database initialization module for Bot Admin Panel.
Uses Alembic for database migrations.
"""
from sqlalchemy import inspect
from db.db_connection import db, engine
from alembic.config import Config
from alembic import command
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_alembic_config():
    """
    Get Alembic configuration object.

    Returns:
        Config: Alembic configuration object
    """
    # Get the directory where this file is located
    current_dir = Path(__file__).parent.parent
    alembic_ini_path = current_dir / "alembic.ini"

    # Create Alembic config
    alembic_cfg = Config(str(alembic_ini_path))
    alembic_cfg.set_main_option("script_location", str(current_dir / "alembic"))

    return alembic_cfg


def check_migration_status() -> bool:
    """
    Check if database migrations are up to date.

    Returns:
        bool: True if migrations are up to date, False otherwise
    """
    try:
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names(schema='public')

        # Check if alembic_version table exists
        if 'alembic_version' not in existing_tables:
            logger.info("📦 Database not initialized with Alembic")
            return False

        # Check if required tables exist
        required_tables = [
            'roles',
            'companies',
            'users',
            'invitations',
            'integrations',
            'bot_personality'
        ]

        missing_tables = [table for table in required_tables if table not in existing_tables]

        if missing_tables:
            logger.warning(f"Missing tables in public schema: {', '.join(missing_tables)}")
            return False

        logger.info("✅ All required public tables exist")
        return True
    except Exception as e:
        logger.error(f"Error checking migration status: {e}")
        return False


def run_migrations():
    """
    Run Alembic migrations to create/update database schema.
    """
    try:
        logger.info("🔧 Running database migrations...")
        alembic_cfg = get_alembic_config()

        # Run migrations to the latest version
        command.upgrade(alembic_cfg, "head")

        logger.info("✅ Database migrations completed successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Error running migrations: {e}")
        raise


def create_required_tables():
    """
    Create required tables if they don't exist using SQLAlchemy models.
    This is a fallback method when Alembic migrations are not available.
    """
    from db.models import Base, Role, Company, User, Invitation, Integration, BotPersonality

    try:
        logger.info("🔧 Creating required tables if they don't exist...")

        # Create all tables defined in models using SQLAlchemy
        # Only creates tables that don't already exist
        Base.metadata.create_all(engine, tables=[
            Role.__table__,
            Company.__table__,
            User.__table__,
            Invitation.__table__,
            Integration.__table__,
            BotPersonality.__table__
        ])

        # Insert default roles if they don't exist
        session = db.get_session()
        try:
            default_roles = [
                {
                    "name": "admin",
                    "permissions": {
                        "chat": True, "knowledge": True, "invite": True,
                        "company": True, "integration": True, "conversation": True, "workflow": True, "customer": True
                    }
                },
                {
                    "name": "knowledge_manager",
                    "permissions": {
                        "chat": False, "knowledge": True, "invite": False,
                        "company": False, "integration": False, "conversation": False, "workflow": True, "customer": False
                    }
                },
                {
                    "name": "agent",
                    "permissions": {
                        "chat": True, "knowledge": False, "invite": False,
                        "company": False, "integration": True, "conversation": True, "workflow": False, "customer": False
                    }
                }
            ]

            for role_data in default_roles:
                existing_role = session.query(Role).filter(Role.name == role_data["name"]).first()
                if not existing_role:
                    new_role = Role(name=role_data["name"], permissions=role_data["permissions"])
                    session.add(new_role)
                    logger.info(f"✅ Created default role: {role_data['name']}")

            session.commit()
        finally:
            session.close()

        logger.info("✅ Required tables created successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Error creating required tables: {e}")
        raise





def initialize_database():
    """
    Main function to initialize the database using Alembic migrations.
    Checks migration status and runs migrations if necessary.
    Falls back to creating tables directly if Alembic migrations fail.
    """
    try:
        logger.info("🚀 Starting database initialization...")

        # Check if migrations are up to date
        if check_migration_status():
            logger.info("✅ Database already initialized and up to date")
            return True

        # Try running Alembic migrations first
        try:
            logger.info("📦 Running database migrations...")
            run_migrations()
            logger.info("✅ Database initialization completed successfully!")
            return True
        except Exception as migration_error:
            logger.warning(f"⚠️ Alembic migrations failed: {migration_error}")
            logger.info("📦 Falling back to creating tables directly...")

            # Fallback: Create tables directly if Alembic fails
            create_required_tables()

            logger.info("✅ Database initialization completed using direct table creation!")
            return True

    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        return False


