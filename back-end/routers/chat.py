import os, json, io
import httpx
from fastapi import APIRouter, HTTPException, Depends, Query, Body, Form, File, UploadFile
from middleware.auth import verify_token
from db.public_table import get_companies
from db.company_table import *
from utils.whatsapp import send_message_whatsapp
from src.response.generate import generate_response_with_search, generate_response_with_image_search
from src.image_vectorize import search_similar_images
from utils.stt import speech_to_text
import threading
import asyncio

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
        result = await send_message_whatsapp(current_conversation["instance_name"], current_conversation['phone_number'], content, {'images':[]})
        if not result:
            raise HTTPException(status_code=500, detail="Error sending message")
    
    # If sender is an agent, attach their email
    email = ""
    if sender_type == "agent":
        email = user["email"]
    
    # Insert new message into database    
    add_query = await add_new_message(
        company_id=company_schema, 
        conversation_id=conversation_id, 
        sender_email=email, 
        sender_type=sender_type, 
        content=content,
        extra='[]'
    )
    
    if add_query["status"] == "success":
        if current_conversation['ai_reply'] == False or sender_type == "agent":
            return {
                "status": 'success',
                "messages": [
                    add_query['rows'][0]
                ]
            }
        
        response = await generate_response_with_search(user["company_id"], company_schema, conversation_id, content)
        print(response)
        
        # Insert new message into database        
        add_response = await add_new_message(
            company_id=company_schema, 
            conversation_id=conversation_id, 
            sender_email="",
            sender_type="bot", 
            content=response,
            extra='[]'
        )
    
        if add_response["status"] == "success":
            return {
                "status": 'success',
                "messages": [
                    add_query['rows'][0], 
                    add_response['rows'][0]]
            }
        else:
            return {
                "status": 'success',
                "messages": [
                            add_query['rows'][0]
                        ]
            }
    else:
        raise HTTPException(status_code=500, detail=add_query['message'])

@router.post("/send-image")
async def send_image_message(
    file: UploadFile = File(...), 
    conversation_id:str = Form(...),
    content:str = Form(...),
    sender_type:str = Form(...),
    user = Depends(verify_token)):
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
        result = await send_message_whatsapp(current_conversation["instance_name"], current_conversation['phone_number'], content, {'images':[full_path]})
        if not result:
            raise HTTPException(status_code=500, detail="Error sending message")
    
    # If sender is an agent, attach their email
    email = ""
    if sender_type == "agent":
        email = user["email"]
    
    file_content = await file.read()
    file_name = file.filename
    storage = supabase.storage.from_("messages-extra")
    existing_file = storage.list(company_schema)
    full_path = False
    for f in existing_file:
        if f['name'] == file_name:
            full_path = f"messages-extra/{company_schema}/{file_name}"
    if not full_path:
        result_file = supabase.storage.from_("messages-extra").upload(
            f"{company_schema}/{file_name}", file_content, {"content-type": file.content_type}
        )
        full_path = result_file.fullPath
    # Insert new message into database
    extra_data = {"images":[full_path]}
    extra_data = f'{extra_data}'.replace('\'', '\"')
    add_query = await add_new_message(
        company_id=company_schema, 
        conversation_id=conversation_id, 
        sender_email=email, 
        sender_type=sender_type, 
        content=content,
        extra = extra_data
    )
    
    if add_query["status"] == "success":
        if current_conversation['ai_reply'] == False or sender_type == "agent":
            return {
                "status": 'success',
                "messages": [
                    add_query['rows'][0]
                ]
            }
            
        file_io = io.BytesIO(file_content)
        matches = search_similar_images(query_image_bytes=file_io, index_name=f'{user["company_id"]}-image')
        response, extra_info = await generate_response_with_image_search(user["company_id"], company_schema, conversation_id, content, matches)
        extra_info = f'{extra_info}'.replace('\'', '\"')
        # Insert new message into database        
        add_response = await add_new_message(
            company_id=company_schema, 
            conversation_id=conversation_id, 
            sender_email="",
            sender_type="bot", 
            content=response,
            extra=extra_info
        )
    
        if add_response["status"] == "success":
            return {
                "status": 'success',
                "messages": [
                    add_query['rows'][0], 
                    add_response['rows'][0]]
            }
        else:
            return {
                "status": 'success',
                "messages": [
                            add_query['rows'][0]
                        ]
            }
    else:
        raise HTTPException(status_code=500, detail=add_query['message'])


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

async def response_in_background(conversation_id: str, company_id: str, company_schema: str, query: str, instance_name:str, phone_number:str):
    try:
        response = await generate_response_with_search(
            company_id=company_id,
            company_schema=company_schema,
            conversation_id=conversation_id,
            query=query
        )
        # Insert new message into database        
        add_response = await add_new_message(
            company_id=company_schema, 
            conversation_id=conversation_id, 
            sender_email="",
            sender_type="bot", 
            content=response,
            extra='[]'
        )
        await send_message_whatsapp(instance_name, phone_number, response, {'images':[]})
        return response
    except Exception as e:
        print(e)
        return None

def run_response_in_thread(conversation_id, company_id, company_schema, query, instance_name, phone_number):
    asyncio.run(response_in_background(conversation_id, company_id, company_schema, query, instance_name, phone_number))


async def response_for_image_in_background(conversation_id: str, company_id: str, company_schema: str, query: str, instance_name:str, phone_number:str, file_io:io.BytesIO):
    try:
        matches = search_similar_images(query_image_bytes=file_io, index_name=f'{company_id}-image')
        response, extra_info = await generate_response_with_image_search(
            company_id=company_id,
            company_schema=company_schema,
            conversation_id=conversation_id,
            query=query,
            image_search=matches
        )
        extra_info_db = f'{extra_info}'.replace('\'', '\"')
        # Insert new message into database        
        add_response = await add_new_message(
            company_id=company_schema, 
            conversation_id=conversation_id, 
            sender_email="",
            sender_type="bot",
            content=response,
            extra=extra_info_db
        )
    
        await send_message_whatsapp(instance_name, phone_number, response, extra_info)
        return response
    except Exception as e:
        print(e)
        return None

def run_response_for_image_in_thread(conversation_id, company_id, company_schema, query, instance_name, phone_number, file_io):
    asyncio.run(response_for_image_in_background(conversation_id, company_id, company_schema, query, instance_name, phone_number, file_io))


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
        content=message['message']['conversation'],
        extra='[]'
    )
    
    # Return success response with new message details
    if messages["status"] == "success":
        
        # Start vectorization in background thread
        thread = threading.Thread(
            target=run_response_in_thread,
            args=(conversation_id, company_id, company_schema,message['message']['conversation'], instanceName, phone_number)
        )
        thread.daemon = True
        thread.start()
        
        return {
            "status": 'success',
        }
    else:
        raise HTTPException(status_code=500, detail=messages['message'])


@router.post("/voice")
async def reply_to_voice_message(
    audio: UploadFile = File(...),
    instanceName: str = Form(...),
    company_id: str = Form(...),
    phone_number: str = Form(...),
    whatsapp_name:str = Form(...),
):
    # Optional: save uploaded file
    audio_bytes = await audio.read()
    # Convert to BytesIO for Whisper
    audio_buffer = io.BytesIO(audio_bytes)
    audio_buffer.name = audio.filename
    message_content = speech_to_text(audio_file=audio_buffer)
    # Debug print
    print(f"Received audio: {audio.filename}")
    print(f"Audio Transcript: {message_content}")
    print(f"Instance: {instanceName}, Company: {company_id}, phone_number: {phone_number}, whatsapp_name: {whatsapp_name}")
    
    if not instanceName or not company_id or not phone_number or not whatsapp_name:
        raise HTTPException(status_code=400, detail="Missing instanceName, company_id or message parameter")
    
    phone_number = phone_number.split('@')[0]
    
    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")
    company_schema = company_info["schema_name"]
    
    conversation = await get_conversatin_by_phone_integration(company_schema, phone_number, instanceName)
    conversation = conversation.get('rows', [])    
    if not conversation:
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
        content=message_content,
        extra='[]'
    )
    
    # Return success response with new message details
    if messages["status"] == "success":
        
        # Start vectorization in background thread
        thread = threading.Thread(
            target=run_response_in_thread,
            args=(conversation_id, company_id, company_schema,message_content, instanceName, phone_number)
        )
        thread.daemon = True
        thread.start()
        
        return {
            "status": 'success',
        }
    else:
        raise HTTPException(status_code=500, detail=messages['message'])


@router.post("/image")
async def reply_to_image_message(
    image: UploadFile = File(...),
    instanceName: str = Form(...),
    company_id: str = Form(...),
    phone_number: str = Form(...),
    whatsapp_name:str = Form(...),
    content:str = Form(...)
):
    
    print(f"Instance: {instanceName}, Company: {company_id}, phone_number: {phone_number}, whatsapp_name: {whatsapp_name}")
    if not instanceName or not company_id or not phone_number or not whatsapp_name:
        raise HTTPException(status_code=400, detail="Missing instanceName, company_id or message parameter")
    
    phone_number = phone_number.split('@')[0]
    
    # Get Company_info
    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")
    company_schema = company_info["schema_name"]
    
    # Check and Add conversation
    conversation = await get_conversatin_by_phone_integration(company_schema, phone_number, instanceName)
    conversation = conversation.get('rows', [])    
    if not conversation:
        new_conversation = await add_new_conversation(company_schema, whatsapp_name, "WhatsApp", phone_number, instanceName)
        if new_conversation["status"] == "success":
            conversation_id = new_conversation['rows'][0]['conversation_id']
        else:
            raise HTTPException(status_code=500, detail=new_conversation['message'])
    else:
        conversation_id = conversation[0]['conversation_id']
    
    # Extra file upload in storage
    file_content = await image.read()
    file_name = image.filename
    storage = supabase.storage.from_("messages-extra")
    existing_file = storage.list(company_schema)
    full_path = False
    for f in existing_file:
        if f['name'] == file_name:
            full_path = f"messages-extra/{company_schema}/{file_name}"
    if not full_path:
        result_file = supabase.storage.from_("messages-extra").upload(
            f"{company_schema}/{file_name}", file_content, {"content-type": image.content_type}
        )
        full_path = result_file.fullPath
    # Insert new message into database
    extra_data = {"images":[full_path]}
    extra_data = f'{extra_data}'.replace('\'', '\"')
    messages = await add_new_message(
        company_id=company_schema, 
        conversation_id=conversation_id, 
        sender_email="", 
        sender_type="customer", 
        content=content,
        extra=extra_data
    ) 
    
    # Return success response with new message details
    if messages["status"] == "success":
        file_io = io.BytesIO(file_content)
        # Start vectorization in background thread
        thread = threading.Thread(
            target=run_response_for_image_in_thread,
            args=(conversation_id, company_id, company_schema,content, instanceName, phone_number, file_io)
        )
        thread.daemon = True
        thread.start()
        
        return {
            "status": 'success',
        }
    else:
        raise HTTPException(status_code=500, detail=messages['message'])