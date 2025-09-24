from fastapi import APIRouter, HTTPException, status, Body
from pydantic import BaseModel
from utils.supabase_client import supabase
from passlib.context import CryptContext
from jose import jwt
import os
from datetime import datetime, timedelta

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    now = datetime.utcnow()
    expire = now + timedelta(hours=1)
    to_encode.update({
        "exp": expire,
        "iat": now
    })
    return jwt.encode(to_encode, os.getenv("JWT_SECRET"), algorithm="HS256")

@router.post("/register")
async def register(
    name:str = Body(...),
    email:str = Body(...),
    password:str = Body(...)
):
    # try:
    # Check if user already exists
    existing_user = supabase.table('users').select('*').eq('email', email).execute()
    if existing_user.data:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Hash password and create user
    hashed_password = hash_password(password)
    data = {
        "name": name,
        "email": email,
        "password": hashed_password
    }
    response = supabase.table('users').insert([data]).execute()
    
    if response.data:
        user = response.data[0]
        # Create JWT token with user info
        token_data = {
            "sub": user["id"],
            "email": user["email"],
            "name": user["name"]
        }
        token = create_access_token(token_data)
        
        return {
            "message": "User registered successfully",
            "token": token,
            "user": {"id": user["id"], "name": user["name"], "email": user["email"]}
        }
    else:
        raise HTTPException(status_code=400, detail="Registration failed")
            
    # except Exception as e:
    #     raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(request: LoginRequest):
    try:
        # Get user from database
        response = supabase.table('users').select('*').eq('email', request.email).eq('active', True).execute()
        
        if not response.data:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user = response.data[0]
        
        # Verify password
        if not verify_password(request.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create JWT token with user info
        token_data = {
            "sub": user["id"],
            "email": user["email"],
            "name": user["name"]
        }
        token = create_access_token(token_data)
        
        return {
            "message": "Login successful",
            "token": token,
            "user": {"id": user["id"], "name": user["name"], "email": user["email"]}
        }
            
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))