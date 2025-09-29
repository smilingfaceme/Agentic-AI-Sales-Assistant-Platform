from fastapi import APIRouter, HTTPException, Depends, Body, Query
from utils.supabase_client import supabase
from middleware.auth import verify_token
from jose import jwt
from passlib.context import CryptContext
import os, time
from datetime import datetime, timedelta

from utils.send_email import send_invitation

# Define API router
router = APIRouter()

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """
    Hashes a plaintext password using bcrypt.
    """
    return pwd_context.hash(password)

def create_access_token(data: dict, period=1):
    """
    Create a JWT access token with expiration and issue time.
    
    Args:
        data (dict): The payload data to encode inside the token.
        period (int): Expiration period in hours (default: 1 hour).
    
    Returns:
        str: Encoded JWT token.
    """
    to_encode = data.copy()
    now = datetime.utcnow()
    expire = now + timedelta(hours=period)
    to_encode.update({
        "exp": expire,   # expiration time
        "iat": now       # issued at
    })
    return jwt.encode(to_encode, os.getenv("JWT_SECRET"), algorithm="HS256")


# ---------------------------
# ROUTES
# ---------------------------

@router.get("/list")
async def get_invitations(user = Depends(verify_token)):
    """
    Get a list of invitations for the authenticated user's company.
    Only accessible by admins.
    """
    try:
        if user['role'] != 'admin':
            raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
        
        response = supabase.table("invitation_with_users").select("*").eq("company_id", user['company_id']).execute()
        
        return {
            "message": "Company settings updated successfully!",
            "invitations": response.data,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/new")
async def invite_user(data = Body(...), user = Depends(verify_token)):
    """
    Invite a new user to the company by sending an invitation email.
    Only accessible by admins.
    """
    try:
        if user['role'] != 'admin':
            raise HTTPException(status_code=400, detail="You are not authorized to perform this action")

        # Create token payload for invitation
        token_data = {
            "email": data["email"],
            "role": data["role"],
            "company_id": user['company_id'],
            "invited_by": user['sub']
        }

        # Token valid for 3 days
        token_hash = create_access_token(token_data, period=24*3)

        # Get company info for email
        response_user = supabase.table("users_with_permissions").select('*').eq("user_id", user['sub']).execute()
        if response_user.data:
            # Send email invitation
            re = send_invitation(
                receiver_email=data["email"], 
                token=token_hash, 
                company_name=response_user.data[0]['company_name'], 
                invited_by=user['email'],
                invited_by_name=response_user.data[0]['name']
            )
            if re:
                # Insert invitation into DB
                new_invitation = {
                    "company_id": user['company_id'],
                    "invited_email": data["email"],
                    "invited_by": user['sub'],
                    "role": data["role"],
                    "status": "pending",
                    "token_hash": token_hash
                }
                response = supabase.table("invitations").insert([new_invitation]).execute()
                return {
                    "message": "Company settings updated successfully!",
                    "invitation": response.data,
                }
            else:
                return {"message": "Failed invite people"}
        else:
            return {"message": "Failed invite people"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/resend")
async def resend_invitation(invitationId = Query(...), user = Depends(verify_token)):
    """
    Resend an invitation email for a given invitation ID.
    Updates token hash and re-sends email.
    """
    if not invitationId:
        raise HTTPException(status_code=400, detail="invitationId are required")
    
    try:
        # Fetch invitation data
        response = supabase.table("invitation_with_users").select("*").eq("id", invitationId).execute()
        if response.data:
            # Generate new token
            token_data = {
                "email": response.data[0]["invited_email"],
                "role": response.data[0]["role_id"],
                "company_id": response.data[0]['company_id'],
                "invited_by": user['sub']
            }
            token_hash = create_access_token(token_data, period=24*3)

            # Send invitation email
            re = send_invitation(
                receiver_email=response.data[0]["invited_email"], 
                token=token_hash, 
                company_name=response.data[0]['company_name'], 
                invited_by=user['email'],
                invited_by_name=response.data[0]['invited_by']
            )
            if re:
                # Update DB with new token
                response = supabase.table("invitations").update({"token_hash": token_hash}).eq("id", invitationId).execute()
                return {"message": f"Resend invitation to {response.data[0]['invited_email']}"}
            else:
                return {"message": f"Failed to resend revoked for {response.data[0]['invited_email']}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        

@router.delete("/revoke")
async def revoke_invited_user(invitation_id = Query(...), user = Depends(verify_token)):
    """
    Revoke a pending invitation by marking its status as 'revoked'.
    Only accessible by admins.
    """
    if not invitation_id:
        raise HTTPException(status_code=400, detail="invitation_idn are required")
    try:
        if user['role'] != 'admin':
            raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
        
        # Update invitation status
        response = supabase.table("invitations").update({"status": 'revoked'}).eq("id", invitation_id).execute()
        return {"message": f"Invitation revoked for {response.data[0]['invited_email']}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/validate")
async def validate_invitation(token = Query(...)):
    """
    Validate an invitation token.
    Checks if token is valid, not expired, and exists in the database.
    """
    if not token:
        raise HTTPException(status_code=400, detail="token is required")
    
    try:
        # Decode token
        payload = jwt.decode(
            token, 
            os.getenv("JWT_SECRET"), 
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        # Check expiration
        if int(payload.get('exp')) < time.time():
            raise HTTPException(status_code=401, detail="Expried token")
       
        # Verify invitation exists in DB
        response = supabase.table("invitation_with_users").select("*").eq("invited_email", payload.get('email')).eq("token_hash", token).execute()
        if response.data:
            return {
                "valid": True,
                "invitedEmail": response.data[0]["invited_email"],
                "role": response.data[0]["role"],
                "companyName": response.data[0]["company_name"]
            }
        else:
            return {"valid": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.post("/complete")
async def complete_invitation(data = Body(...)):
    """
    Complete the invitation process:
    - Decode token
    - Create user account with provided name & password
    - Update invitation status to 'accepted'
    - Generate JWT token for the new user
    """
    token = data['token']
    name = data['name']
    password = data['password']
    
    if not token or not name or not password:
        raise HTTPException(status_code=400, detail="token, name and password are required")
    
    try:
        # Decode token
        payload = jwt.decode(
            token, 
            os.getenv("JWT_SECRET"), 
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        if int(payload.get('exp')) < time.time():
            raise HTTPException(status_code=401, detail="Expried token")
        
        # Validate invitation in DB
        response = supabase.table("invitation_with_users").select("*").eq("invited_email", payload.get('email')).eq("token_hash", token).execute()
        
        if response.data:
            # Create user
            hashed_password = hash_password(password)
            data = {
                "name": name,
                "email": payload.get('email'),
                "password": hashed_password,
                "company_id": payload.get('company_id'),
                "role": payload.get('role'),
                "invited_by": payload.get('invited_by')
            }
            response_users = supabase.table('users').insert([data]).execute()
            if response_users.data:
                user = response_users.data[0]

                # Mark invitation as accepted
                response_invitation = supabase.table("invitations").update({"status": 'accepted'}).eq("id", response.data[0]['id']).execute()

                # Get role/permissions (defaulting to admin for now)
                response_role = supabase.table('roles').select('*').eq('name', 'admin').execute()

                # Create auth token for user
                token_data = {
                    "sub": user["id"],
                    "email": user["email"],
                    "role": response.data[0]['role'],
                    "company_id": payload.get('company_id'),
                    "permissions": response_role.data[0]['permissions']
                }
                token = create_access_token(token_data)
            
            return {
                "message": "User registered successfully",
                "token": token,
                "user": {
                    "name": user["name"], 
                    "email": user["email"], 
                    "company_name": response.data[0]['company_name'],
                    "role": response_role.data[0]['name'],
                    "permissions": response_role.data[0]['permissions']
                }
            }
        else:
            return {"valid": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=e.__dict__['message'])