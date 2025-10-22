from fastapi import APIRouter, HTTPException, Depends, Query, Body
from middleware.auth import verify_token
from db.public_table import get_companies
from db.company_table import add_new_conversation, get_all_conversations, get_unanswered_conversations, toggle_ai_reply_for_conversation

# Initialize FastAPI router for conversation-related routes
router = APIRouter()

@router.get("/")
async def get_conversations(user = Depends(verify_token)):
    """
    Retrieve all conversations for the authenticated user's company.

    - Verifies user authentication using `verify_token`.
    - Fetches the company schema based on the user's company ID.
    - Retrieves all conversations from the corresponding company schema.
    - Returns a JSON response with a list of conversations.
    """
    if not user['permission'].get("conversation", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    
    company_id = user["company_id"]
    company_info = get_companies("id", company_id)

    # If company is not found, raise 400 error
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")

    company_schema = company_info["schema_name"]

    # Fetch all conversations for this company
    all_companies = await get_all_conversations(company_schema)

    if all_companies["status"] == "success":
        return {
            "status": 'success',
            "conversations": all_companies.get('rows', [])
        }
    else:
        # Internal server error if DB query fails
        raise HTTPException(status_code=500, detail=all_companies['message'])


@router.get("/unanswered")
async def get_unanswered_questions(user = Depends(verify_token)):
    """
    Retrieve all unanswered questions (conversations without responses) 
    for the authenticated user's company.

    - Verifies user authentication.
    - Fetches the company schema using company ID.
    - Queries unanswered conversations from the schema.
    - Returns unanswered messages in JSON format.
    """
    if not user['permission'].get("conversation", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    
    company_id = user["company_id"]
    company_info = get_companies("id", company_id)

    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")

    company_schema = company_info["schema_name"]

    # Fetch unanswered conversations/messages
    all_companies = await get_unanswered_conversations(company_schema)

    if all_companies["status"] == "success":
        return {
            "status": 'success',
            "messages": all_companies.get('rows', [])
        }
    else:
        raise HTTPException(status_code=500, detail=all_companies['message'])


@router.post("/create")
async def create_new_conversation(data = Body(...), user = Depends(verify_token)):
    """
    Create a new conversation for the authenticated user's company.

    Request Body:
    - conversation_name (str): Name of the conversation.
    - source (str): Source of the conversation (e.g., WhatsApp, Web).
    - phone_number (str): Associated phone number for the conversation.

    Process:
    - Validates request body fields.
    - Retrieves company schema using the authenticated user's company ID.
    - Inserts a new conversation record into the company schema.
    - Returns the newly created conversation in JSON format.
    """
    conversation_name = data["conversation_name"]
    source = data['source']
    phone_number = data['phone_number']
    # Ensure required fields exist
    if not conversation_name or not source:
        raise HTTPException(status_code=400, detail="Conversation name and source are required")
    
    if not user['permission'].get("conversation", False):
        if source == "Test" and user['permission'].get("knowledge", False):
            pass
        else:
            raise HTTPException(status_code=400, detail="You are not authorized to perform this action") 

    company_id = user["company_id"]
    company_info = get_companies("id", company_id)

    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")

    company_schema = company_info["schema_name"]

    # Insert a new conversation into database
    new_record = await add_new_conversation(company_schema, conversation_name, source, phone_number)

    if new_record["status"] == "success":
        return {
            "status": 'success',
            "conversations": new_record.get('rows', [])
        }
    else:
        raise HTTPException(status_code=500, detail=new_record['message'])

@router.post("/toggle-ai-reply")
async def toggle_ai_reply(data = Body(...), user = Depends(verify_token)):
    """
    Toggle AI reply for a conversation.

    Request Body:
    - conversation_id (str): ID of the conversation to toggle AI reply.

    Process:
    - Validates request body fields.
    - Retrieves company schema using the authenticated user's company ID.
    - Toggles the AI reply status for the conversation.
    - Returns the updated conversation in JSON format.
    """
    conversation_id = data["conversation_id"]
    if not conversation_id:
        raise HTTPException(status_code=400, detail="conversation_id is required")
    
    company_id = user["company_id"]
    company_info = get_companies("id", company_id)

    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")

    company_schema = company_info["schema_name"]

    # Toggle AI reply for the conversation
    toggle_ai_reply = await toggle_ai_reply_for_conversation(company_schema, conversation_id)

    if toggle_ai_reply["status"] == "success":
        return {
            "status": 'success',
            "conversations": toggle_ai_reply.get('rows', [])
        }
    else:
        raise HTTPException(status_code=500, detail=toggle_ai_reply['message'])