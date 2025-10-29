"""
SQLAlchemy database connection and session management for Bot Admin Panel
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL connection parameters
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "")
DB_USER = os.getenv("POSTGRES_USER", "")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")

# Build database URL
DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL query logging
    pool_pre_ping=True,  # Verify connections before using them
    poolclass=NullPool  # Disable connection pooling for better control
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class DatabaseClient:
    """SQLAlchemy-based database client for Bot Admin Panel"""

    def __init__(self):
        self.engine = engine
        self.SessionLocal = SessionLocal

    def get_session(self) -> Session:
        """Get a new database session"""
        return self.SessionLocal()

    def execute_raw(self, query: str, params: dict = None):
        """Execute raw SQL query (for DDL statements like CREATE TABLE)"""
        session = self.get_session()
        try:
            if params:
                session.execute(text(query), params)
            else:
                session.execute(text(query))
            session.commit()
            return True
        except Exception as e:
            session.rollback()
            print(f"Error executing raw query: {e}")
            return False
        finally:
            session.close()

    def close(self):
        """Close the database connection"""
        self.engine.dispose()


# Initialize database client
db = DatabaseClient()