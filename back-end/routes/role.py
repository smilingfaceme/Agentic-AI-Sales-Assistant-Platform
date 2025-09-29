from fastapi import APIRouter, HTTPException, Depends, Body
from utils.supabase_client import supabase
from middleware.auth import verify_token

# Initialize a FastAPI router instance
router = APIRouter()

@router.get("/get")
async def update_company(user = Depends(verify_token)):
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
    try:
        # Query the 'roles' table to get all role records
        response = supabase.table("roles").select("*").execute()

        # If roles exist, return them along with a success message
        if response.data:
            return {
                "message": "Company settings updated successfully!",
                "roles": response.data
            }

    except Exception as e:
        # Raise an HTTP 500 error if something goes wrong
        raise HTTPException(status_code=500, detail=str(e))
