# Import required modules from FastAPI, Pydantic, utilities, and external libraries
from fastapi import APIRouter, HTTPException, status, Body
from pydantic import BaseModel
from utils.supabase_client import supabase
from passlib.context import CryptContext
from jose import jwt
import os
from datetime import datetime, timedelta
import time

# Initialize API router
router = APIRouter()

# Initialize password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# -------------------------------
# Request Models
# -------------------------------
class RegisterRequest(BaseModel):
    """
    Schema for user registration request.
    """
    name: str
    email: str
    company: str
    description: str
    password: str

class LoginRequest(BaseModel):
    """
    Schema for user login request.
    """
    email: str
    password: str

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

def create_access_token(data: dict):
    """
    Creates a JWT access token with user data.
    
    Args:
        data (dict): User-related payload to encode into the token.
    
    Returns:
        str: Encoded JWT token.
    """
    to_encode = data.copy()
    now = datetime.utcnow()
    expire = now + timedelta(hours=1)  # Token valid for 1 hour
    to_encode.update({
        "exp": expire,  # Expiration time
        "iat": now      # Issued at time
    })
    return jwt.encode(to_encode, os.getenv("JWT_SECRET"), algorithm="HS256")

# -------------------------------
# Routes
# -------------------------------
@router.post("/register")
async def register(
    name: str = Body(...),
    email: str = Body(...),
    password: str = Body(...),
    company: str = Body(...),
    description: str = Body(...)
):
    """
    Register a new user along with their company.
    
    - Checks if the user already exists.
    - Creates a new company record.
    - Creates a user with the 'admin' role.
    - Returns a JWT token and user information.
    """
    # Check if user already exists
    existing_user = supabase.table('users').select('*').eq('email', email).execute()
    if existing_user.data:
        response = supabase.table('users_with_permissions').select('*').eq('email', email).execute()
        if not response.data:
            raise HTTPException(
                status_code=400, 
                detail="You’ve previously registered with this email, but your account has been deleted. "
                       "If you’d like to recover your account, please contact our support team."
            )
        else:
            raise HTTPException(status_code=400, detail="User already exists")
    
    # Create a unique schema name for the company
    company_schema_name = f"company_{str(time.time()).replace('.', '')}"
    companies_data = {
        'name': company,
        'description': description,
        'schema_name': company_schema_name
    }
    
    # Insert company data
    response_company = supabase.table('companies').insert([companies_data]).execute()
    if response_company.data:
        # Fetch admin role
        response_role = supabase.table('roles').select('*').eq('name', 'admin').execute()
        if response_role.data:
            # Hash password and create user
            hashed_password = hash_password(password)
            data = {
                "name": name,
                "email": email,
                "password": hashed_password,
                "company_id": response_company.data[0]['id'],
                "role": response_role.data[0]['id'],
            }
            response_users = supabase.table('users').insert([data]).execute()
            if response_users.data:
                user = response_users.data[0]
                # Create JWT token with user info
                token_data = {
                    "sub": user["id"],
                    "email": user["email"],
                    "role": response_role.data[0]['name'],
                    "company_id": response_company.data[0]['id'],
                    "permissions": response_role.data[0]['permissions']
                }
                token = create_access_token(token_data)
                
                return {
                    "message": "User registered successfully",
                    "token": token,
                    "user": {
                        "name": user["name"], 
                        "email": user["email"], 
                        "company_name": response_company.data[0]['name'],
                        "company_description": response_company.data[0]['description'],
                        "role": response_role.data[0]['name'],
                        "permissions": response_role.data[0]['permissions']
                    }
                }
    else:
        raise HTTPException(status_code=400, detail="Registration failed")

@router.post("/login")
async def login(request: LoginRequest):
    """
    Authenticate a user with email and password.
    
    - Validates the user exists and is active.
    - Verifies the password.
    - Returns a JWT token and user information.
    """
    try:
        # Get user from database
        response = supabase.table('users_with_permissions').select('*').eq('email', request.email).execute()
        
        if not response.data:
            raise HTTPException(status_code=401, detail="User not found. Please register before logging in.")
        
        user = response.data[0]
        if user["active"] == False:
            raise HTTPException(
                status_code=401, 
                detail="The Company Account has not been activated. "
                       "Please contact the administrator of the company to activate your account or your company."
            )
        
        # Verify password
        if not verify_password(request.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create JWT token with user info
        token_data = {
            "sub": user["user_id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role_name"],
            "company_id": user["company_id"],
            "permissions": user['permissions']
        }
        token = create_access_token(token_data)
        
        return {
            "message": "Login successful",
            "token": token,
            "user": {
                "name": user["name"], 
                "email": user["email"],
                "company_name": user['company_name'],
                "company_description": user["company_description"],
                "role": user['role_name'],
                "permissions": user['permissions']
            }
        }
            
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))