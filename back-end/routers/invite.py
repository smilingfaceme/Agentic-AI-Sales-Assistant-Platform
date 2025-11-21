from fastapi import APIRouter, HTTPException, Depends, Body, Query
from middleware.auth import verify_token

from db.public_table import *
from utils.token_handler import hash_password, create_access_token, decode_valide_access_token
from utils.send_email_without_smtp import send_invitation
import os, time

# Define API router
router = APIRouter()

# ---------------------------
# ROUTES
# ---------------------------

@router.get("/list")
async def get_invitations_list(user = Depends(verify_token)):
    """
    Get a list of invitations for the authenticated user's company.
    Only accessible by admins.
    """
    if not user['permission'].get("invite", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")

    invitations = get_invitations_with_users("company_id", user['company_id'])
    if invitations is None:
        return {
            "message": "Company settings updated successfully!",
            "invitations": [],
        }
    else:
        return {
            "message": "Company settings updated successfully!",
            "invitations": invitations,
        }

@router.get("/get_roles")
async def get_roles_list(user = Depends(verify_token)):
    """
    Fetch all roles from the database.

    This endpoint requires authentication (via verify_token).
    On success, it retrieves all records from the 'roles' table in Supabase
    and returns them along with a success message.

    Args:
        user: The authenticated user information provided by the verify_token dependency.

    Returns:
        dict: A dictionary containing a success message and the list of roles.

    Raises:
        HTTPException: If any error occurs while querying the database.
    """
    roles = get_roles()
    return {
        "message": "Company settings updated successfully!",
        "roles": roles,
    }

@router.post("/new")
async def invite_user(data = Body(...), user = Depends(verify_token)):
    """
    Invite a new user to the company by sending an invitation email.
    Only accessible by admins.
    """
    invited_email = data["email"]
    invited_role = data["role"]
    
    # Validate inputs
    if not invited_email or not invited_role:
        raise HTTPException(status_code=400, detail="email and role are required")
    
    if not user['permission'].get("invite", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    
    # Check if user already exists
    existed_usr = get_users("email", invited_email)
    if existed_usr:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Check if invitation already exists
    existed_invitation = get_invitations("invited_email", invited_email)
    if existed_invitation:
        raise HTTPException(status_code=400, detail="Invitation already exists")
    
    # Get inviter user info
    inviter_user = get_user_with_permission("email", user['email'])
    if not inviter_user:
        raise HTTPException(status_code=400, detail="Company not found")
    
    # Create token payload for invitation
    token_data = {
        "email": invited_email,
        "role": invited_role,
        "company_id": user['company_id'],
        "invited_by": user['id']
    }
    
    # Token valid for 3 days
    token_hash = create_access_token(token_data, period=24*3)
    
    new_record_invitation = add_invitation(
        company_id=user['company_id'],
        email=invited_email,
        invited_by=user['id'],
        role=invited_role,
        token_hash=token_hash
    )
    
    if not new_record_invitation:
        raise HTTPException(status_code=400, detail="Failed to create invitation")
    
    # Send email invitation
    re = send_invitation(
        receiver_email=invited_email, 
        token=token_hash, 
        company_name=inviter_user['company_name'], 
        invited_by=user['email'],
        invited_by_name=inviter_user['name']
    )
    
    if not re:
        update_invitation_by_id(new_record_invitation['id'], {"status": 'failed'})
        raise HTTPException(status_code=400, detail="Failed to send invitation")
    
    return {
        "message": "Company settings updated successfully!",
        "invitation": new_record_invitation,
    }

@router.post("/resend")
async def resend_invitation(invitationId = Query(...), user = Depends(verify_token)):
    """
    Resend an invitation email for a given invitation ID.
    Updates token hash and re-sends email.
    """
    if not invitationId:
        raise HTTPException(status_code=400, detail="invitationId are required")
    
    invitations = get_invitations_with_users("id", invitationId)
    if not invitations:
        raise HTTPException(status_code=400, detail="Invitation not found")
    invitation = invitations[0]
    # Check if user is admin
    if not user['permission'].get("invite", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    
    # Generate new token
    token_data = {
        "email": invitation["invited_email"],
        "role": invitation["role_id"],
        "company_id": invitation['company_id'],
        "invited_by": user['id']
    }
    
    token_hash = create_access_token(token_data, period=24*3)
    
    # Update invitation
    updated_invitation = update_invitation_by_id(invitationId, {"token_hash": token_hash, "status": 'pending'})
    
    if updated_invitation is None:
        raise HTTPException(status_code=400, detail="Failed to update invitation")
    
    # Send invitation email
    re = send_invitation(
        receiver_email=invitation["invited_email"], 
        token=token_hash, 
        company_name=invitation['company_name'], 
        invited_by=user['email'],
        invited_by_name=invitation['invited_by']
    )
    
    if not re:
        update_invitation_by_id(invitationId, {"status": 'falied'})
        raise HTTPException(status_code=400, detail="Failed to resend invitation")
    
    return {
        "message": "Invitation resent successfully!",
        "invitation": updated_invitation,
    }

@router.delete("/revoke")
async def revoke_invited_user(invitation_id = Query(...), user = Depends(verify_token)):
    """
    Revoke a pending invitation by marking its status as 'revoked'.
    Only accessible by admins.
    """
    if not invitation_id:
        raise HTTPException(status_code=400, detail="invitation_idn are required")

    # check if user is admin
    if not user['permission'].get("invite", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    
    # Revoke invitation
    revoke_invitation = update_invitation_by_id(invitation_id, {"status": 'revoked'})
    if not revoke_invitation:
        raise HTTPException(status_code=400, detail="Failed to revoke invitation")
    else:
        return {
            "message": "Invitation revoked successfully!",
            "invitation": revoke_invitation,
        }

@router.get("/validate")
async def validate_invitation(token = Query(...)):
    """
    Validate an invitation token.
    Checks if token is valid, not expired, and exists in the database.
    """
    if not token:
        raise HTTPException(status_code=400, detail="token is required")
    
    # Decode token
    payload = decode_valide_access_token(token)
    
    # Check expiration
    if not payload:
        raise HTTPException(status_code=401, detail="Expried token")
    
    invitations = get_invitations_with_users("invited_email", payload.get('email'))
    if not invitations:
        raise HTTPException(status_code=400, detail="Invitation not found")
    invitation = invitations[0]
    
    if invitation['status'] != 'pending':
        raise HTTPException(status_code=400, detail="Invitation is not pending")
    
    if invitation['token_hash'] != token:
        raise HTTPException(status_code=400, detail="Invalid token")
    
    return {
        "valid": True,
        "invitedEmail": invitation["invited_email"],
        "role": invitation["role"],
        "companyName": invitation["company_name"]
    }

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
    
    # Decode token
    payload = decode_valide_access_token(token)
    
    # Check expiration
    if not payload:
        raise HTTPException(status_code=401, detail="Expried token")
    
    # Validate invitation in DB
    invitations = get_invitations_with_users("invited_email", payload.get('email'))
    if not invitations:
        raise HTTPException(status_code=400, detail="Invitation not found")
    invitation = invitations[0]
    
    if invitation['status'] != 'pending':
        raise HTTPException(status_code=400, detail="Invitation is not pending")
    
    if invitation['token_hash'] != token:
        raise HTTPException(status_code=400, detail="Invalid token")
    
    # Create user
    data = {
        "name": name,
        "email": payload.get('email'),
        "password": password,
        "company_id": payload.get('company_id'),
        "role": payload.get('role'),
        "invited_by": payload.get('invited_by')
    }

    new_user = add_new_user(name, payload.get('email'), password, payload.get('company_id'), payload.get('role'), payload.get('invited_by'))
    if not new_user:
        raise HTTPException(status_code=400, detail="Failed to create user")
    
    # Mark invitation as accepted
    updated_invitation = update_invitation_by_id(invitation['id'], {"status": 'accepted'})
    if not updated_invitation:
        raise HTTPException(status_code=400, detail="Failed to update invitation")
    
    # Generate JWT token for new user
    role_info = get_roles("id", payload.get('role'))
    token_data = {
        "sub": new_user["id"],
        "email": new_user["email"],
        "role": payload.get('role'),
        "company_id": payload.get('company_id'),
        "permissions": role_info['permissions']
    }
    token = create_access_token(token_data)
    
    return {
        "message": "User registered successfully",
        "token": token,
        "user": {
            "name": new_user["name"], 
            "email": new_user["email"], 
            "company_name": invitation['company_name'],
            "role": role_info['name'],
            "permissions": role_info['permissions']
        }
    }