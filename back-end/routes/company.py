from fastapi import APIRouter, HTTPException, Depends, Body, Query
from utils.supabase_client import supabase
from middleware.auth import verify_token
from jose import jwt
import os
from datetime import datetime, timedelta

router = APIRouter()

def create_access_token(data: dict, period=1):
    """
    Create a JWT access token with an expiration time.

    Args:
        data (dict): Payload data to encode into the token.
        period (int): Number of hours until the token expires. Defaults to 1.

    Returns:
        str: Encoded JWT token.
    """
    to_encode = data.copy()
    now = datetime.utcnow()
    expire = now + timedelta(hours=period)
    to_encode.update({
        "exp": expire,   # Expiration time
        "iat": now       # Issued at time
    })
    return jwt.encode(to_encode, os.getenv("JWT_SECRET"), algorithm="HS256")


@router.put("/update")
async def update_company(data = Body(...), user = Depends(verify_token)):
    """
    Update company information such as name and description.

    Requirements:
        - The user must be authenticated (via verify_token).
        - The user must have the 'admin' role.

    Args:
        data (dict): Request body containing company details (name, description).
        user (dict): Authenticated user data, injected via dependency.

    Returns:
        dict: Confirmation message and updated company details.
    """
    try:
        # Ensure only admins can update company info
        if user['role'] != 'admin':
            raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
        
        # Update company information in Supabase
        response = supabase.table("companies").update({
            "name": data['name'],
            "description": data['description']
        }).eq("id", user['company_id']).execute()
        
        return {
            "message": "Company settings updated successfully!",
            "name": response.data[0]['name'],
            "description": response.data[0]['description'],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete")
async def update_profile(user = Depends(verify_token)):
    """
    Mark a company profile as deleted.

    Requirements:
        - The user must be authenticated (via verify_token).
        - The user must have the 'admin' role.

    Args:
        user (dict): Authenticated user data, injected via dependency.

    Returns:
        dict: Confirmation message and company details (marked as deleted).
    """
    try:
        # Ensure only admins can delete company info
        if user['role'] != 'admin':
            raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
        
        # Soft delete: mark company as deleted in Supabase
        response = supabase.table("companies").update({
            "delete": True,
        }).eq("id", user['company_id']).execute()
        
        return {
            "message": "Profile updated successfully!",
            "name": response.data[0]['name'],
            "description": response.data[0]['description'],
        }
    except Exception as e:
        # Return 401 Unauthorized if deletion fails
        raise HTTPException(status_code=401, detail=str(e))
