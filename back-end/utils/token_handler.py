# Import required modules from FastAPI, Pydantic, utilities, and external libraries
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import os, time
import hashlib
from uuid import UUID

# Initialize password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# -------------------------------
# Utility Functions
# -------------------------------


def hash_password(password: str) -> str:
    # Encode to bytes, hash with SHA-256, and return hex digest
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def verify_password(plain_password: str, db_password: str) -> bool:
    """
    Verifies a plain-text password against a hashed password.
    """
    hashed_password = hash_password(db_password)
    if hashed_password == plain_password:
        return True
    else:
        return False

def create_access_token(data: dict, period: int = 3):
    """
    Creates a JWT access token with user data.

    Args:
        data (dict): User-related payload to encode into the token.

    Returns:
        str: Encoded JWT token.
    """
    to_encode = data.copy()

    # Convert any UUID objects to strings for JSON serialization
    for key, value in to_encode.items():
        if isinstance(value, UUID):
            to_encode[key] = str(value)

    now = datetime.utcnow()
    expire = now + timedelta(hours=period)  # Token valid for 1 hour
    to_encode.update({
        "exp": expire,  # Expiration time
        "iat": now      # Issued at time
    })
    return jwt.encode(to_encode, os.getenv("JWT_SECRET"), algorithm="HS256")

def decode_valide_access_token(token: str):
    """
    Decodes a JWT access token.
    
    Args:
        token (str): JWT token to decode.
    
    Returns:
        dict: Decoded payload if valid, None otherwise.
    """
    try:
        payload = jwt.decode(
            token, 
            os.getenv("JWT_SECRET"), 
            algorithms=["HS256"],
            options={"verify_aud": False}  # Skip audience validation
        )
        
        # Validate expiration time
        if int(payload.get('exp')) < time.time():
            return None
        else:
            return payload
    except:
        return None
