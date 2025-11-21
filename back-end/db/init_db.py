"""
Database initialization module for Bot Admin Panel.
Uses Alembic for database migrations.
"""
from sqlalchemy import text, inspect
from db.db_connection import db, engine
from alembic.config import Config
from alembic import command
import logging
import os
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





def initialize_database():
    """
    Main function to initialize the database using Alembic migrations.
    Checks migration status and runs migrations if necessary.
    """
    try:
        logger.info("🚀 Starting database initialization...")

        # Check if migrations are up to date
        if check_migration_status():
            logger.info("✅ Database already initialized and up to date")
            return True

        # Run migrations
        logger.info("📦 Running database migrations...")
        run_migrations()

        logger.info("✅ Database initialization completed successfully!")
        return True

    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        return False


