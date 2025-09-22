from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from models.project import create_project, get_projects_by_user_id
from middleware.auth import verify_token

router = APIRouter()

class CreateProjectRequest(BaseModel):
    name: str
    description: str

@router.post("/create")
async def create_project_endpoint(
    request: CreateProjectRequest,
    user = Depends(verify_token)
):
    user_id = user["sub"]
    
    if not user_id or not request.name or not request.description:
        raise HTTPException(status_code=400, detail="user_id, name and description are required")
    
    result = await create_project(user_id, request.name, request.description)
    
    if result["error"]:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return {"project": result["data"][0]}

@router.get("/get")
async def get_projects_endpoint(user = Depends(verify_token)):
    user_id = user["sub"]
    
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    result = await get_projects_by_user_id(user_id)
    
    if result["error"]:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return {"projects": result["data"]}