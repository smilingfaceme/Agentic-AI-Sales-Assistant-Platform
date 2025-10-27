from fastapi import APIRouter, HTTPException, Depends, UploadFile, Body, File, Form
from middleware.auth import verify_token
from db.supabase_client import supabase
import tempfile
import os, json
from typing import Optional
from src.vectorize import vectorize_file
import pandas as pd
from src.utils.file_utills import generate_file_hash
from src.utils.chroma_utils import delete_file_vectors
import threading
import io, asyncio

# Create a new FastAPI router for handling file storage operations
router = APIRouter()

def run_vectorize_in_thread(file_content, file_name, company_id, record_id, primary_column):
    asyncio.run(vectorize_in_background(file_content, file_name, company_id, record_id, primary_column))

async def vectorize_in_background(file_content: bytes, file_name: str, company_id: str, record_id: str, primary_column:str):
    """Background task to vectorize uploaded file"""
    try:
        # Convert bytes to BytesIO for vectorize_file function
        file_io = io.BytesIO(file_content)
        
        # Run vectorization
        result = vectorize_file(
            file_content=file_io,
            file_name=file_name,
            index_name=company_id,
            primary_column=primary_column
        )
        
        # Update database record status
        if result["status"] == "success":
            supabase.table("knowledges").update({
                "status": "Completed"
            }).eq("id", record_id).execute()
        else:
            supabase.table("knowledges").update({
                "status": "Failed"
            }).eq("id", record_id).execute()
            
    except Exception as e:
        print(f"Vectorization failed: {str(e)}")
        supabase.table("knowledges").update({
            "status": "Failed"
        }).eq("id", record_id).execute()

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
        files = supabase.table("knowledges").select("*").eq("company_id", company_id).execute()
        # storage = supabase.storage.from_('knowledges')
        # response = storage.list(company_id)
        return {
            "company_id": company_id,
            "knowledges": files.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    columns = Form(..., default_factory=list),
    primary_column:str = Form(...),
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
    if not file or not company_id:
        raise HTTPException(status_code=400, detail="No file provided")
    
    selected_columns = json.loads(columns)
    try:
        file_content = await file.read()
        file_name = file.filename
        file_hash = generate_file_hash(file_content)
        
        existing_file = supabase.table("knowledges").select("*").eq("file_hash", file_hash).eq("company_id", company_id).execute()
        if existing_file.data:
            raise HTTPException(status_code=400, detail="File already exists")
        
        response = supabase.storage.from_('knowledges').upload(
            f"{company_id}/{file_name}",
            file_content,
            {"content-type": file.content_type}
        )
        
        if response.full_path:
            new_record = supabase.table("knowledges").insert([{
                "company_id": company_id,
                "uploaded_by": user["id"],
                "file_name": file_name,
                "file_type": file.content_type,
                "file_hash": file_hash,
                "primary_column": primary_column,
                "status": "Processing",
                "extra": selected_columns
            }]).execute()
            
            if new_record.data:
                record_id = new_record.data[0]["id"]
                
                # Start vectorization in background thread
                thread = threading.Thread(
                    target=run_vectorize_in_thread,
                    args=(file_content, file_name, company_id, record_id, primary_column)
                )
                thread.daemon = True
                thread.start()
                
                return {"message": "File uploaded successfully, vectorization started", "data": new_record.data[0]}
            else:
                raise HTTPException(status_code=500, detail="Failed to create knowledge record")
        else:
            raise HTTPException(status_code=500, detail="Failed to upload file")
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
    file_id = data["file_id"]
    file = supabase.table("knowledges").select("*").eq("id", file_id).execute()
    if not file.data:
        raise HTTPException(status_code=400, detail="File not found")
    file_name = file.data[0]["file_name"]
    file_hash = file.data[0]["file_hash"]
    try:
        delete_file_vectors(company_id, file_hash)
        supabase.table("knowledges").delete().eq("id", file_id).execute()
        response = supabase.storage.from_('knowledges').remove([f"{company_id}/{file_name}"])
        return {"message": "File removed successfully", "data": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reprocess")
async def reprocess_file(
    data = Body(...),
    user = Depends(verify_token)
):
    company_id = user["company_id"]
    file_id = data.get("file_id")

    # Validate input
    if not file_id:
        raise HTTPException(status_code=400, detail="file_id is required")

    # Fetch file record
    file_info = supabase.table("knowledges").select("*").eq("id", file_id).single().execute()
    if not file_info.data:
        raise HTTPException(status_code=404, detail="File not found")

    file_name = file_info.data["file_name"]
    primary_column = file_info.data["primary_column"]

    # Download file from Supabase Storage (as bytes)
    try:
        file_response = supabase.storage.from_("knowledges").download(f"{company_id}/{file_name}")
        if not file_response:
            raise HTTPException(status_code=404, detail="File not found in storage")

        # Create in-memory file-like object
        file_content = file_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading file: {str(e)}")

    # Process file asynchronously (no local save)
    try:
        thread = threading.Thread(
            target=run_vectorize_in_thread,
            args=(file_content, file_name, company_id, file_id, primary_column),
            daemon=True
        )
        thread.start()
        
        supabase.table("knowledges").update({
            "status": "Processing"
        }).eq("id", file_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Background processing failed: {str(e)}")
    
    return {"message": "File reprocessing started", "file_id": file_id}