import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL connection parameters
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "")
DB_USER = os.getenv("POSTGRES_USER", "")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")

class PostgreSQLClient:
    """PostgreSQL database client for Bot Admin Panel"""

    def __init__(self):
        self.connection = None
        self.connect()

    def connect(self):
        """Establish connection to PostgreSQL database"""
        try:
            self.connection = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                database=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD
            )
        except psycopg2.Error as e:
            print(f"Error connecting to PostgreSQL: {e}")
            raise

    def execute_query(self, query, params=None):
        """Execute a SELECT query and return results"""
        try:
            cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            cursor.execute(query, params)
            results = cursor.fetchall()
            cursor.close()
            return results
        except psycopg2.Error as e:
            print(f"Error executing query: {e}")
            return None

    def execute_insert(self, query, params=None):
        """Execute an INSERT query and return the inserted row"""
        try:
            cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            cursor.execute(query, params)
            self.connection.commit()
            result = cursor.fetchone()
            cursor.close()
            return result
        except psycopg2.Error as e:
            self.connection.rollback()
            print(f"Error executing insert: {e}")
            return None

    def execute_update(self, query, params=None):
        """Execute an UPDATE query and return the updated row"""
        try:
            cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            cursor.execute(query, params)
            self.connection.commit()
            result = cursor.fetchone()
            cursor.close()
            return result
        except psycopg2.Error as e:
            self.connection.rollback()
            print(f"Error executing update: {e}")
            return None

    def execute_delete(self, query, params=None):
        """Execute a DELETE query"""
        try:
            cursor = self.connection.cursor()
            cursor.execute(query, params)
            self.connection.commit()
            cursor.close()
            return True
        except psycopg2.Error as e:
            self.connection.rollback()
            print(f"Error executing delete: {e}")
            return False

    def execute_raw(self, query, params=None):
        """Execute raw SQL query (for DDL statements like CREATE TABLE)"""
        try:
            cursor = self.connection.cursor()
            cursor.execute(query, params)
            self.connection.commit()
            cursor.close()
            return True
        except psycopg2.Error as e:
            self.connection.rollback()
            print(f"Error executing raw query: {e}")
            return False

    def close(self):
        """Close the database connection"""
        if self.connection:
            self.connection.close()

# Initialize PostgreSQL client
db = PostgreSQLClient()