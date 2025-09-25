from fastapi import APIRouter, HTTPException, Depends, UploadFile,Body, File, Query
from middleware.auth import verify_token
from utils.supabase_client import supabase

router = APIRouter()

@router.get("/list")
async def get_file_list(
    project_id: str = Query(...),
    user = Depends(verify_token)
):
    if not project_id:
        raise HTTPException(status_code=400, detail="Project ID is required")
    
    try:
        storage = supabase.storage.from_('knowledges')
        response = storage.list(project_id)
        return {"knowledges": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_file(
    project_id: str = Query(...),
    file: UploadFile = File(...),
    user = Depends(verify_token)
):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if not project_id:
        raise HTTPException(status_code=400, detail="Project ID is required")
    
    try:
        file_content = await file.read()
        file_name = file.filename
        
        response = supabase.storage.from_('knowledges').upload(
            f"{project_id}/{file_name}",
            file_content,
            {"content-type": file.content_type}
        )
        
        return {"message": "File uploaded successfully", "data": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/remove")
async def remove_file(
    project_id: str = Body(...),
    file_name: str = Body(...),
    user = Depends(verify_token)
):
    try:
        response = supabase.storage.from_('knowledges').remove([f"{project_id}/{file_name}"])
        return {"message": "File removed successfully", "data": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))