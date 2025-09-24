import os
import httpx
from fastapi import APIRouter, HTTPException, Depends, Query, Body
from middleware.auth import verify_token
from utils.supabase_client import supabase

router = APIRouter()

WhatsApp_Bot_URL = os.getenv("WhatsApp_Bot_URL")

@router.get("/history")
async def get_chats(
    conversation_id: str = Query(...),
    user = Depends(verify_token)
):
    if not conversation_id:
        raise HTTPException(status_code=400, detail="Missing conversation_id parameter")
    
    try:
        response = supabase.table('messages_with_users').select('*').eq('conversation_id', conversation_id).order('created_at', desc=False).execute()
        return {"messages": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.post("/send")
async def send_message(
    conversation_id: str = Body(...),
    content: str = Body(...),
    sender_type: str = Body(...),
    user = Depends(verify_token)
):
    if not conversation_id or not content or not sender_type:
        raise HTTPException(status_code=400, detail="Missing conversation_id, content or sender_type parameter")
    
    conversation = supabase.table('conversations').select('*').eq('conversation_id', conversation_id).execute()
    if conversation.data == []:
        raise HTTPException(status_code=400, detail="Conversation not found")

    if conversation.data[0]['source'] == 'WhatsApp':
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{WhatsApp_Bot_URL}/send",
                json={
                    "project_id": conversation.data[0]['project_id'],
                    'to': conversation.data[0]['phone_number'],
                    'message': content
                }
            )
            if response.status_code > 300 :
                raise HTTPException(status_code=500, detail="Error sending message")
    
    sender_id = None
    email = None
    if sender_type == "agent":
        sender_id = user["sub"]
        email = user["email"]

    data = {
        "conversation_id": conversation_id,
        "content": content,
        "sender_type": sender_type,
        "sender_id": sender_id
    }
    
    try:
        response = supabase.table('messages').insert(data).execute()
        response_data = {
            'message_id': response.data[0]['message_id'],
            'conversation_id':conversation_id,
            'sender_type':sender_type,
            'content':content,
            'created_at':response.data[0]['created_at'],
            'user_id':sender_id,
            'email':email,
        }
        return {"message": response_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))