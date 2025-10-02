# Import required modules from FastAPI, Pydantic, utilities, and external libraries
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import os, time

# Initialize password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# -------------------------------
# Utility Functions
# -------------------------------

def hash_password(password: str) -> str:
    """
    Hashes a plain-text password using bcrypt.
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain-text password against a hashed password.
    """
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, period: int = 1):
    """
    Creates a JWT access token with user data.
    
    Args:
        data (dict): User-related payload to encode into the token.
    
    Returns:
        str: Encoded JWT token.
    """
    to_encode = data.copy()
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
