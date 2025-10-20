# Import necessary modules
from fastapi import APIRouter, HTTPException, Depends, Body
from db.public_table import *
from utils.whatsapp import start_whatsapp, combine_uuids, logout_whatsapp
from middleware.auth import verify_token

# Initialize FastAPI router
router = APIRouter()

@router.get("/")
async def get_all_integrations(user = Depends(verify_token)):
    if not user['permission'].get("integration", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    integrations = get_integrations({"company_id": user["company_id"], 'delete': False})
    if not integrations:
        return {
            "integrations":[]
        }
    for i in integrations:
        await start_whatsapp(i["company_id"], i["created_by"], i["instance_name"])
    return {
        "integrations":integrations
    }

@router.post("/new")
async def new_integrations(data = Body(...), user = Depends(verify_token)):
    
    if not user['permission'].get("integration", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    
    instanceName = data["instanceName"]
    company_id = user["company_id"]
    request_id = user["id"]
    order = 0
    integrations = get_integrations({"company_id": company_id})
    
    if integrations:
        order = len(integrations)
    
    if instanceName:
        instance_name = instanceName
    else:
        instance_name = combine_uuids(company_id, request_id, order)
    
    response = await start_whatsapp(company_id, request_id, instance_name)
    
    if response["success"] == True and response["message"] == "Bot connected":
        phone_number = response['user']['id'].split(':')[0]
        new_record = add_new_integration(company_id=company_id, created_by=request_id, instance_name=instance_name, phone_number=phone_number, type="whatsapp_web")
        if not new_record:
            response["message"] = "Bot running, status unknown"
    
    return {
        "response": response
    }

@router.post("/active")
async def new_integrations(data = Body(...), user = Depends(verify_token)):
    if not user['permission'].get("integration", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    integrationId = data["integrationId"]
    if not integrationId:
        raise HTTPException(status_code=400, detail="integrationId is required")
    
    integration = get_integrations({"id": integrationId})
    
    if not integration:
        raise HTTPException(status_code=400, detail="integration not found")
    
    instance_name = update_integration_by_id(integrationId, {"is_active": not integration[0]['is_active']})
    
    if not instance_name:
        raise HTTPException(status_code=400, detail="Failed to update integration")
    
    return {
        "response": "success"
    }

@router.post("/logout")
async def new_integrations(data = Body(...), user = Depends(verify_token)):
    if not user['permission'].get("integration", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    integrationId = data["integrationId"]
    if not integrationId:
        raise HTTPException(status_code=400, detail="integrationId is required")
    
    integration = get_integrations({"id": integrationId})
    
    if not integration:
        raise HTTPException(status_code=400, detail="integration not found")
    print(integration[0]['instance_name'])
    response = await logout_whatsapp(integration[0]['instance_name'])
    print(response)
    if response["success"] == True:
        update_integration_by_id(integrationId, {"delete": True})
        raise HTTPException(status_code=400, detail="Failed to update integration")
    
    return {
        "response": "success"
    }