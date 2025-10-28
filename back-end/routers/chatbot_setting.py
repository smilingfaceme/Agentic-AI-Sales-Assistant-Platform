from fastapi import APIRouter, HTTPException, Depends, Body
from db.public_table import get_chatbot_personality, update_chatbot_personality_by_id
from middleware.auth import verify_token

router = APIRouter()

@router.get("/status")
async def status_of_chatbot(user = Depends(verify_token)):
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
    company_id = user['company_id']
    
    chatbot_personality = get_chatbot_personality(company_id)
    if not chatbot_personality:
        raise HTTPException(status_code=400, detail="Chatbot personality not found")
    return {
        "message": "Chatbot personality found!",
        "chatbot_personality": chatbot_personality
    }

@router.post("/update")
async def update_chatbot_personality(data = Body(...), user = Depends(verify_token)):
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
    updated_chatbot_personality = update_chatbot_personality_by_id(user['company_id'], data)
    
    if not updated_chatbot_personality:
        raise HTTPException(status_code=500, detail="Failed to update chatbot personality")
    
    return {
        "message": "Chatbot personality updated successfully!",
        "chatbot_personality": updated_chatbot_personality
    }