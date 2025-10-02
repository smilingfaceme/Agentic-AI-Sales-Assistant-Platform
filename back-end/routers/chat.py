import os, json
import httpx
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from middleware.auth import verify_token
from db.public_table import get_companies
from db.company_table import *
from utils.whatsapp import send_message_whatsapp
from datetime import datetime

router = APIRouter()

# Environment variable for WhatsApp Bot service URL
WhatsApp_Bot_URL = os.getenv("WhatsApp_Bot_URL")

@router.post("/send")
async def send_message(data = Body(...), user = Depends(verify_token)):
    """
    Send a message in a specific conversation.

    Steps:
    1. Validate request body parameters (conversation_id, content, sender_type).
    2. Retrieve company info using the authenticated user.
    3. Fetch the target conversation by ID from the company schema.
    4. If the conversation source is WhatsApp, forward the message to the WhatsApp Bot API.
    5. Store the message in the database (add_new_message).
    6. Return success response with the newly added message.
    
    Parameters:
    - data (dict): Contains conversation_id, content, and sender_type.
    - user (dict): Authenticated user (injected via token).
    
    Returns:
    - JSON response with status and stored message details.
    """
    conversation_id = data["conversation_id"]
    content = data["content"]
    sender_type = data["sender_type"]
    
    # Validate required parameters
    if not conversation_id or not content or not sender_type:
        raise HTTPException(status_code=400, detail="Missing conversation_id, content or sender_type parameter")
    
    # Fetch company info using user’s company_id
    company_info = get_companies("id", user["company_id"])
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")
    company_schema = company_info["schema_name"]
    
    # Fetch conversation details by ID
    conversations = await get_conversation_by_id(company_schema, conversation_id)
    
    if conversations["status"] != "success" or conversations["rows"] == []:
        raise HTTPException(status_code=500, detail=conversations['message'])

    current_conversation = conversations["rows"][0]
    
    if not user['permission'].get("chat", False):
        if current_conversation['source'] == "Test" and user['permission'].get("knowledge", False):
            pass
        else:
            raise HTTPException(status_code=400, detail="You are not authorized to perform this action")  
    
    # If conversation source is WhatsApp, send message via WhatsApp Bot
    if current_conversation['source'] == 'WhatsApp':
        result = await send_message_whatsapp(current_conversation["instance_name"], current_conversation['phone_number'], content)
        if not result:
            raise HTTPException(status_code=500, detail="Error sending message")
    
    # If sender is an agent, attach their email
    email = ""
    if sender_type == "agent":
        email = user["email"]
    
    # Insert new message into database
    updated_conversation = await add_new_message(
        company_id=company_schema, 
        conversation_id=conversation_id, 
        sender_email=email, 
        sender_type=sender_type, 
        content=content
    )
    
    # Return success response with new message details
    if updated_conversation["status"] == "success":
        return {
            "status": 'success',
            "message": updated_conversation['rows'][0]
        }
    else:
        raise HTTPException(status_code=500, detail=updated_conversation['message'])


@router.get("/history")
async def get_chats(conversation_id: str = Query(...), user = Depends(verify_token)):
    """
    Retrieve the full chat history of a conversation.

    Steps:
    1. Validate conversation_id parameter.
    2. Retrieve company info using the authenticated user.
    3. Fetch all messages for the given conversation ID from the database.
    4. Return all messages if successful.
    
    Parameters:
    - conversation_id (str): Unique identifier of the conversation.
    - user (dict): Authenticated user (injected via token).
    
    Returns:
    - JSON response with status and list of messages.
    """
    # Fetch company info using user’s company_id
    company_info = get_companies("id", user["company_id"])
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")
    company_schema = company_info["schema_name"]
    
    # Validate conversation_id
    if not conversation_id:
        raise HTTPException(status_code=400, detail="Missing conversation_id parameter")
    
    # Retrieve all messages from the database
    messages = await get_all_messages(company_schema, conversation_id)
    if messages["status"] != "success":
        raise HTTPException(status_code=500, detail=messages['message'])
    
    return {
        "status": 'success',
        "messages": messages['rows']
    }

@router.post("/reply")
async def reply_to_message(data = Body(...)):
    instanceName = data['instanceName']
    company_id = data['company_id']
    message = data['message']
    print(message)
    if not instanceName or not company_id or not message:
        raise HTTPException(status_code=400, detail="Missing instanceName, company_id or message parameter")
    
    phone_number = message["key"]["remoteJid"].split('@')[0]
    
    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")
    company_schema = company_info["schema_name"]
    
    conversation = await get_conversatin_by_phone_integration(company_schema, phone_number, instanceName)
    conversation = conversation.get('rows', [])    
    if not conversation:
        whatsapp_name = message['pushName']
        new_conversation = await add_new_conversation(company_schema, whatsapp_name, "WhatsApp", phone_number, instanceName)
        if new_conversation["status"] == "success":
            conversation_id = new_conversation['rows'][0]['conversation_id']
        else:
            raise HTTPException(status_code=500, detail=new_conversation['message'])
    else:
        conversation_id = conversation[0]['conversation_id']
    
    messages = await add_new_message(
        company_id=company_schema, 
        conversation_id=conversation_id, 
        sender_email="", 
        sender_type="customer", 
        content=message['message']['conversation']
    )
    
    # Return success response with new message details
    if messages["status"] == "success":
        return {
            "status": 'success',
        }
    else:
        raise HTTPException(status_code=500, detail=messages['message'])