from fastapi import APIRouter, HTTPException, Depends, Query, Body, Path
from utils.supabase_client import supabase
from passlib.context import CryptContext
import time
from middleware.auth import verify_token

# Initialize FastAPI router
router = APIRouter()

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """
    Hash a plain text password using bcrypt.
    
    Args:
        password (str): The plain text password to hash.
    
    Returns:
        str: The hashed password.
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify if a plain text password matches the hashed password.
    
    Args:
        plain_password (str): The password provided by the user.
        hashed_password (str): The stored hashed password.
    
    Returns:
        bool: True if the passwords match, otherwise False.
    """
    return pwd_context.verify(plain_password, hashed_password)

@router.put("/password")
async def update_password(data = Body(...), user = Depends(verify_token)):
    """
    Update the user's password.
    
    This endpoint requires the user to provide their current password
    and a new password. The current password is verified before updating
    the database with the new hashed password.
    
    Args:
        data (dict): Body data containing "currentPassword" and "newPassword".
        user (dict): Authenticated user data from JWT (via verify_token).
    
    Returns:
        dict: Success message when the password is updated.
    """
    try:
        # Retrieve user from database by ID
        response = supabase.table('users').select('*').eq("id", user['sub']).execute()
        
        if not response.data:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify the provided current password against stored hash
        if not verify_password(data["currentPassword"], response.data[0]["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Hash the new password
        hashed_new_password = hash_password(data["newPassword"])
        
        # Update the password in the database
        response = supabase.table("users").update({"password": hashed_new_password}).eq("id", user['sub']).execute()
        
        return {
            "message": "Password updated successfully!"
        }
            
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(status_code=401, detail=str(e))

@router.put("/profile")
async def update_profile(data = Body(...), user = Depends(verify_token)):
    """
    Update the user's profile information.
    
    Currently, this endpoint only updates the user's name in the database.
    
    Args:
        data (dict): Body data containing "name".
        user (dict): Authenticated user data from JWT (via verify_token).
    
    Returns:
        dict: Success message with the updated name.
    """
    try:
        # Update user profile (name) in the database
        response = supabase.table("users").update({"name": data['name']}).eq("id", user['sub']).execute()
        
        if not response.data:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        return {
            "message": "Profile updated successfully!",
            "name": response.data[0]['name']
        }
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(status_code=401, detail=str(e))