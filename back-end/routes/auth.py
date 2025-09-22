from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from utils.supabase_client import supabase

router = APIRouter()

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
async def register(request: RegisterRequest):
    try:
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {"display_name": request.name}
            }
        })
        
        if response.user:
            return {"message": "User registered successfully", "user": response.user}
        else:
            raise HTTPException(status_code=400, detail="Registration failed")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(request: LoginRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        if response.user and response.session:
            return {
                "message": "Login successful",
                "token": response.session.access_token
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))