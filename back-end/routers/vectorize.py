from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from middleware.auth import verify_token
from src.vectorize import vectorize_file, search_vectors, delete_file_vectors
import tempfile
import os
from typing import Optional

router = APIRouter()

@router.post("/upload")
async def vectorize_uploaded_file(
    file: UploadFile = File(...),
    user = Depends(verify_token)
):
    """
    Upload and vectorize a CSV or XLSX file
    
    Args:
        file: CSV or XLSX file to upload
        user: Authenticated user
        
    Returns:
        Vectorization results
    """
    if not user['permission'].get("knowledge", False):
        raise HTTPException(status_code=403, detail="You are not authorized to perform this action")
    
    # Validate file type
    allowed_extensions = ['.csv', '.xlsx', '.xls']
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Only CSV and Excel files are supported. Allowed extensions: {', '.join(allowed_extensions)}"
        )
    
    # Create temporary file with correct extension
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
        try:
            # Write uploaded file to temp location
            content = await file.read()
            temp_file.write(content)
            temp_file.flush()
            
            # Vectorize the file
            result = vectorize_file(
                file_path=temp_file.name,
                index_name=user["company_id"],
                company_id=user["company_id"]
            )
            
            if result["status"] == "error":
                raise HTTPException(status_code=500, detail=result["message"])
            
            return result
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
        finally:
            # Clean up temp file
            if os.path.exists(temp_file.name):
                os.unlink(temp_file.name)

@router.post("/search")
async def search_knowledge(
    query: str = Form(...),
    top_k: int = Form(5),
    file_name: Optional[str] = Form(None),
    user = Depends(verify_token)
):
    """
    Search for similar content in vectorized knowledge base
    
    Args:
        query: Search query text
        top_k: Number of results to return
        file_name: Optional file name filter
        user: Authenticated user
        
    Returns:
        Search results
    """
    if not user['permission'].get("knowledge", False):
        raise HTTPException(status_code=403, detail="You are not authorized to perform this action")
    
    try:
        result = search_vectors(
            index_name=user["company_id"],
            query_text=query,
            company_id=user["company_id"],
            top_k=top_k,
            file_name=file_name
        )
        
        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=result["message"])
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching vectors: {str(e)}")

@router.delete("/file")
async def delete_file_from_index(
    file_hash: str = Query(...),
    user = Depends(verify_token)
):
    """
    Delete all vectors for a specific file from the index
    
    Args:
        file_hash: Hash of the file to delete
        user: Authenticated user
        
    Returns:
        Deletion results
    """
    if not user['permission'].get("knowledge", False):
        raise HTTPException(status_code=403, detail="You are not authorized to perform this action")
    
    try:
        deleted_count = delete_file_vectors(user["company_id"], file_hash)
        
        return {
            "status": "success",
            "message": f"Deleted {deleted_count} vectors for file",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file vectors: {str(e)}")
