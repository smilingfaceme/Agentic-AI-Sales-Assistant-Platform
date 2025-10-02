from fastapi import APIRouter, HTTPException, Depends, UploadFile, Body, File
from middleware.auth import verify_token
from db.supabase_client import supabase

# Create a new FastAPI router for handling file storage operations
router = APIRouter()

@router.get("/list")
async def get_file_list(
    user = Depends(verify_token)
):
    """
    Retrieve a list of files stored in the company's 'knowledges' storage bucket.
    
    - Requires authentication via `verify_token`.
    - Uses the company_id from the authenticated user to scope files.
    - Returns a JSON object containing the company_id and the list of files.
    """
    if not user['permission'].get("knowledge", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    
    company_id = user["company_id"]
    if not company_id:
        raise HTTPException(status_code=400, detail="Project ID is required")
    
    try:
        storage = supabase.storage.from_('knowledges')
        response = storage.list(company_id)
        return {
            "company_id": company_id,
            "knowledges": response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    user = Depends(verify_token)
):
    """
    Upload a file to the company's 'knowledges' storage bucket.
    
    - Requires authentication via `verify_token`.
    - Validates that a file is provided and the company_id exists.
    - Reads the uploaded file and stores it in the Supabase bucket under the company_id folder.
    - Returns a success message and the Supabase response object.
    """
    if not user['permission'].get("knowledge", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    company_id = user["company_id"]
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if not company_id:
        raise HTTPException(status_code=400, detail="Project ID is required")
    
    try:
        file_content = await file.read()
        file_name = file.filename
        
        response = supabase.storage.from_('knowledges').upload(
            f"{company_id}/{file_name}",
            file_content,
            {"content-type": file.content_type}
        )
        
        return {"message": "File uploaded successfully", "data": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/remove")
async def remove_file(
    data = Body(...),
    user = Depends(verify_token)
):
    """
    Remove a file from the company's 'knowledges' storage bucket.
    
    - Requires authentication via `verify_token`.
    - Accepts a JSON body containing `file_name` to identify which file to delete.
    - Uses the company_id from the authenticated user to ensure correct scoping.
    - Returns a success message and the Supabase response object.
    """
    if not user['permission'].get("knowledge", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    company_id = user["company_id"]
    file_name = data["file_name"]
    try:
        response = supabase.storage.from_('knowledges').remove([f"{company_id}/{file_name}"])
        return {"message": "File removed successfully", "data": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))