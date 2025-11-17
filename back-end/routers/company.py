from fastapi import APIRouter, HTTPException, Depends, Body
from db.public_table import update_company_by_id
from middleware.auth import verify_token

router = APIRouter()

# ---------------------------
# ROUTES
# ---------------------------

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
    new_name = data['name']
    description = data['description']
    
    # Validate input
    if not new_name:
        return HTTPException(status_code=400, detail="Name is required")
    
    # Ensure only admins can update company info
    if not user['permission'].get("company", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    
    # Update company information in Supabase
    updated_company = update_company_by_id(user['company_id'], {"name":new_name, "description": description})
    
    if not updated_company:
        raise HTTPException(status_code=500, detail="Failed to update company information")
    
    return {
        "message": "Company settings updated successfully!",
        "name": updated_company['name'],
        "description": updated_company['description'],
    }


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
    # Ensure only admins can delete company info
    if not user['permission'].get("company", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
        
    deleted_company = update_company_by_id(user['company_id'], {"delete": True})
    if not deleted_company:
        raise HTTPException(status_code=500, detail="Failed to delete company information")
    
    return {
        "message": "Company deleted successfully!",
    }
