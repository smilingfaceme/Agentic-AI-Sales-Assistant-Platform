from fastapi import APIRouter, HTTPException, Depends, UploadFile, Body, File, Form
from middleware.auth import verify_token
import tempfile
import os, json
from typing import Optional
from src.vectorize import vectorize_file
import pandas as pd
from src.utils.file_utills import generate_file_hash
from src.utils.chroma_utils import delete_file_vectors
from db.public_table import get_companies
from db.company_table import get_all_knowledges, get_knowledge_by_file_hash, add_new_knowledge, update_knowledge_status_by_id, get_knowledge_by_id, delete_knowledge_by_id
import threading
import io, asyncio

# Create a new FastAPI router for handling file storage operations
router = APIRouter()

def run_vectorize_in_thread(file_content, file_name, company_id, record_id, primary_column, company_schema):
    asyncio.run(vectorize_in_background(file_content, file_name, company_id, record_id, primary_column, company_schema))

async def vectorize_in_background(file_content: bytes, file_name: str, company_id: str, record_id: str, primary_column:str, company_schema:str):
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
            update_knowledge_status_by_id(company_schema, record_id, "Completed")
        else:
            update_knowledge_status_by_id(company_schema, record_id, "Failed")
            
    except Exception as e:
        print(f"Vectorization failed: {str(e)}")
        update_knowledge_status_by_id(company_schema, record_id, "Failed")

# ---------------------------
# ROUTES
# ---------------------------

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
    
    company_id = user.get("company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="Project ID is required")

    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")

    company_schema = company_info["schema_name"]
    
    try:
        files = get_all_knowledges(company_schema)
        return {
            "company_id": company_id,
            "knowledges": files
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

    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")

    company_schema = company_info["schema_name"]
    primary_column = primary_column.strip("'").replace(" ", "_").replace("-", "_").replace("/", "_").replace("(", "_").replace(")", "_").replace(".", "_").lower()
    selected_columns = json.loads(columns)
    # try:
    file_content = await file.read()
    file_name = file.filename
    file_hash = generate_file_hash(file_content)
    
    existing_file = get_knowledge_by_file_hash(company_id=company_schema, file_hash=file_hash)
    if existing_file:
        raise HTTPException(status_code=400, detail="File already exists")
    
    # Define local save path
    save_dir = os.path.join("files", "knowledges",str(company_id))
    os.makedirs(save_dir, exist_ok=True)

    # Build full path for the file
    full_path = os.path.join(save_dir, file_name)

    # Save the file locally
    with open(full_path, "wb") as f:
        f.write(file_content)
    
    new_record = add_new_knowledge(company_schema, file_name, file.content_type, file_hash, full_path, "Processing", primary_column, json.dumps(selected_columns))
    
    if new_record:
        record_id = new_record[0]["id"]
        
        # Start vectorization in background thread
        thread = threading.Thread(
            target=run_vectorize_in_thread,
            args=(file_content, file_name, company_id, record_id, primary_column, company_schema)
        )
        thread.daemon = True
        thread.start()
        
        return {"message": "File uploaded successfully, vectorization started", "data": new_record[0]}
    else:
        raise HTTPException(status_code=500, detail="Failed to create knowledge record")
        
    # except Exception as e:
    #     raise HTTPException(status_code=500, detail=str(e))

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
    if not company_id:
        raise HTTPException(status_code=400, detail="No file provided")

    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")

    company_schema = company_info["schema_name"]
    file_id = data["file_id"]
    file = get_knowledge_by_id(company_schema, file_id)
    if not file:
        raise HTTPException(status_code=400, detail="File not found")
    file_name = file[0]["file_name"]
    file_hash = file[0]["file_hash"]
    try:
        delete_file_vectors(company_id, file_hash)
        delete_file_vectors(f'{company_id}-columns', file_hash)
        delete_knowledge_by_id(company_schema, file_id)
        file_path = file[0]["full_path"]
        os.remove(file_path)
        return {"message": "File removed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reprocess")
async def reprocess_file(
    data = Body(...),
    user = Depends(verify_token)
):
    company_id = user["company_id"]
    company_id = user["company_id"]
    if not company_id:
        raise HTTPException(status_code=400, detail="No file provided")

    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")

    company_schema = company_info["schema_name"]
    file_id = data.get("file_id")

    # Validate input
    if not file_id:
        raise HTTPException(status_code=400, detail="file_id is required")

    # Fetch file record
    file_info = get_knowledge_by_id(company_schema, file_id)
    if not file_info:
        raise HTTPException(status_code=404, detail="File not found")

    file_name = file_info[0]["file_name"]
    full_path = file_info[0]["full_path"]
    primary_column = file_info[0]["primary_column"]

    # Download file from Supabase Storage (as bytes)
    try:
        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail="File not found locally")

        # Read file content as bytes
        with open(full_path, "rb") as f:
            file_content = f.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading file: {str(e)}")

    # Process file asynchronously (no local save)
    try:
        thread = threading.Thread(
            target=run_vectorize_in_thread,
            args=(file_content, file_name, company_id, file_id, primary_column, company_schema),
            daemon=True
        )
        thread.start()
        
        update_knowledge_status_by_id(company_schema, file_id, "Processing")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Background processing failed: {str(e)}")
    
    return {"message": "File reprocessing started", "file_id": file_id}