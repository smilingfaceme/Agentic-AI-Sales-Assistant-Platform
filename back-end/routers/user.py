# Import necessary modules
from fastapi import APIRouter, HTTPException, Depends, Body, Query
from db.public_table import get_users, update_user_by_id, get_users_by_role
from utils.token_handler import hash_password, verify_password
from middleware.auth import verify_token

# Initialize FastAPI router
router = APIRouter()

# ---------------------------
# ROUTES
# ---------------------------

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
    current_password = data["currentPassword"]
    new_password = data["newPassword"]
    
    # Validate input
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Current and new password are required")
    
    # Retrieve user from database by ID
    request_user = get_users("id", user['id'])
    if not user:
        raise HTTPException(status_code=401, detail="You are not authorized to perform this action")
    
    # Verify the provided current password against stored hash
    if not verify_password(current_password, request_user['password']):
        raise HTTPException(status_code=500, detail="Current password is incorrect")
    
    # Update the password in the database
    updated_user = update_user_by_id(user['id'], {"password": new_password})
    if not updated_user:
        raise HTTPException(status_code=500, detail="Failed to update password")
    
    return {
        "message": "Password updated successfully!"
    }


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
    new_name = data['name']
    # Validate input
    if not data['name']:
        raise HTTPException(status_code=400, detail="Name is required")

    # Update the name in the database
    updated_user = update_user_by_id(user['id'], {"name": new_name})
    if not updated_user:
        raise HTTPException(status_code=401, detail="Failed to update profile")

    return {
        "message": "Profile updated successfully!",
        "name": updated_user['name']
    }


@router.get("/by-role")
async def get_users_by_role_endpoint(role: str = Query(...), user = Depends(verify_token)):
    """
    Get all users by role name for the authenticated user's company.

    This endpoint retrieves all active users with a specific role
    (e.g., 'agent', 'admin') within the same company as the authenticated user.

    Args:
        role_name (str): The name of the role to filter users by (e.g., 'agent', 'admin').
        user (dict): Authenticated user data from JWT (via verify_token).

    Returns:
        dict: Success message with the list of users matching the role.
    """
    # Validate role name
    if not role:
        raise HTTPException(status_code=400, detail="Role name is required")

    # Get users by role for the authenticated user's company
    users = get_users_by_role(role, user['company_id'])

    return {
        "message": f"Users with role '{role}' retrieved successfully",
        "users": users
    }