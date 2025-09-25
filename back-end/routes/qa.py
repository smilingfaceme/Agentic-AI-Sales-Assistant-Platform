import os
from fastapi import APIRouter, HTTPException, Depends, Query, Body, Path
from middleware.auth import verify_token
from utils.supabase_client import supabase
import httpx

router = APIRouter()

WhatsApp_Bot_URL = os.getenv("WhatsApp_Bot_URL")

@router.post("/reply")
async def qa_reply(project_id: str = Body(...), message: dict = Body(...)):
    if not project_id or not message:
        raise HTTPException(status_code=400, detail="Missing project_id parameter")
    
    phone_number = message["key"]["remoteJid"].split('@')[0]
    whatsapp_name = message['pushName']
    conversation = supabase.table('conversations').select('*').eq('project_id', project_id).eq('phone_number', phone_number).execute()
    
    if (conversation.data == []):
        conversation_data = {
            'project_id': project_id,
            'source': 'WhatsApp',
            'conversation_name': whatsapp_name,
            'phone_number': phone_number
        }
        response = supabase.table('conversations').insert([conversation_data]).execute()
        conversation_id = response.data[0]['conversation_id']
    else:
        conversation_id = conversation.data[0]['conversation_id']
    
    content = message["message"]["conversation"]
    sender_type = "customer"
    sender_id = None

    data = {
        "conversation_id": conversation_id,
        "content": content,
        "sender_type": sender_type,
        "sender_id": sender_id
    }
    
    try:
        response = supabase.table('messages').insert(data).execute()
        return {"success": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))