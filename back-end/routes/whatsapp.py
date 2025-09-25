import os
from fastapi import APIRouter, HTTPException, Depends, Query, Body, Path
from middleware.auth import verify_token
import httpx

router = APIRouter()

WhatsApp_Bot_URL = os.getenv("WhatsApp_Bot_URL")

@router.post("/connect")
async def connect_whatsapp(project_id: str = Query(...), user = Depends(verify_token)):
    if not project_id:
        raise HTTPException(status_code=400, detail="Missing project_id parameter")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{WhatsApp_Bot_URL}/status",
            json={"project_id": project_id}
        )
    
    return {
        "project_id": project_id,
        "response": response.json()
    }

@router.post("/start")
async def start_whatsapp(project_id: str = Query(...), user = Depends(verify_token)):
    if not project_id:
        raise HTTPException(status_code=400, detail="Missing project_id parameter")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{WhatsApp_Bot_URL}/start",
            json={"project_id": project_id}
        )
    
    return {
        "project_id": project_id,
        "response": response.json()
    }

@router.post("/stop")
async def stop_whatsapp(project_id: str = Query(...), user = Depends(verify_token)):
    if not project_id:
        raise HTTPException(status_code=400, detail="Missing project_id parameter")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{WhatsApp_Bot_URL}/stop",
            json={"project_id": project_id}
        )
    
    return {
        "project_id": project_id,
        "response": response.json()
    }

@router.post("/logout")
async def logout_whatsapp(project_id: str = Query(...), user = Depends(verify_token)):
    if not project_id:
        raise HTTPException(status_code=400, detail="Missing project_id parameter")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{WhatsApp_Bot_URL}/logout",
            json={"project_id": project_id}
        )
    
    return {
        "project_id": project_id,
        "response": response.json()
    }