from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import os, time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Use FastAPI's HTTPBearer for extracting the Authorization header
security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify JWT token from the request's Authorization header.
    
    Steps:
    - Extract token from HTTP Bearer credentials.
    - Decode token using the JWT_SECRET.
    - Validate required claims (sub, email, role, company_id, permissions).
    - Check token expiration.
    
    Returns:
        dict: A dictionary containing user information (sub, email, role, company_id, permissions).
    
    Raises:
        HTTPException: If the token is invalid, expired, or missing required claims.
    """
    try:
        # Extract the raw JWT token string
        token = credentials.credentials
        
        # Decode JWT with the secret and HS256 algorithm
        payload = jwt.decode(
            token, 
            os.getenv("JWT_SECRET"), 
            algorithms=["HS256"],
            options={"verify_aud": False}  # Skip audience validation
        )
        
        # Extract claims from the payload
        user_id = payload.get("sub")
        email = payload.get("email")
        role = payload.get("role")
        company_id = payload.get("company_id")
        permissions = payload.get("permissions")
        
        # Validate expiration time
        if int(payload.get('exp')) < time.time():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Ensure required claims are present
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Return verified user details
        return {
            "sub": user_id, 
            'email': email, 
            'role': role, 
            'company_id': company_id, 
            "permissions": permissions
        }
    
    except JWTError:
        # Handle invalid signature, malformed token, or decoding errors
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )