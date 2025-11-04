from fastapi import APIRouter, HTTPException, Depends, UploadFile, Body, File, Query, Form
from middleware.auth import verify_token
from src.utils.file_utills import generate_file_hash
from db.public_table import get_companies
from db.company_table import *
import os
from collections import defaultdict
router = APIRouter()

# ----------------------------- #
# Endpoint: List Files
# ----------------------------- #
@router.get("/list")
async def get_file_list(
    page_size: int = Query(...),
    page_start: int = Query(...),
    user=Depends(verify_token),
):
    if not user['permission'].get("knowledge"):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")

    company_id = user.get("company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="Project ID is required")

    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")

    company_schema = company_info["schema_name"]

    try:
        files = get_documents_from_table(company_schema, page_size, page_start)
        # group items by file_hash
        groups = defaultdict(list)
        for item in files:
            groups[item["file_hash"]].append(item)

        # build result list
        result = []

        for file_hash, items in groups.items():
            statuses = {item["status"] for item in items}
            target_status = None

            if "Failed" in statuses:
                target_status = "Failed"
            elif "Completed" in statuses:
                target_status = "Completed"

            # only return if there is a status to update
            if target_status:
                ids_to_update = [item["id"] for item in items if item["status"] != target_status]
                if ids_to_update:  # only include if something actually changes
                    result.append({
                        "file_hash": file_hash,
                        "ids": ids_to_update,
                        "target_status": target_status
                    })
        
        for item in result:
            update_documents_status_on_table_by_hash(company_id=company_schema, file_hash=item["file_hash"], status=item["target_status"])
        
        if result:
            files = get_documents_from_table(company_schema, page_size, page_start)
        
        count = get_all_documents_from_table(company_schema)
        return {
            "status": "success",
            "company_id": company_id,
            "documents": files,
            "total": count[0]["count"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------------- #
# Endpoint: Upload File
# ----------------------------- #
@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    match_field:str = Form(...),
    user=Depends(verify_token),
):
    if not user['permission'].get("knowledge"):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    match_field = match_field.strip()
    company_id = user.get("company_id")
    if not file or not company_id:
        raise HTTPException(status_code=400, detail="No file provided")

    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")

    company_schema = company_info["schema_name"]

    try:
        file_content = await file.read()
        file_name = file.filename.split("/")[-1].lower()
        file_hash = generate_file_hash(file_content)
        match_field = match_field.strip("'").replace(" ", "_").replace("-", "_").replace("/", "_").replace("(", "_").replace(")", "_").replace(".", "_").lower()
        existing_file = get_same_documents_from_table(company_id=company_schema, file_hash=file_hash)

        if existing_file:
            existing_file_name = [i["file_name"] for i in existing_file]
            if file_name in existing_file_name:
                raise HTTPException(status_code=400, detail="Existed already in the system")
            
            full_path = existing_file[0]["full_path"]
            status = existing_file[0]["status"]
        else:
            # Define local save path
            save_dir = os.path.join("files", "documents",str(company_id))
            os.makedirs(save_dir, exist_ok=True)

            # Build full path for the file
            full_path = os.path.join(save_dir, file_name)

            # Save the file locally
            with open(full_path, "wb") as f:
                f.write(file_content)
            status = "Completed"
        
        image_file = add_new_document(
            company_id=company_schema,
            file_name=file_name,
            file_type=file.content_type,
            file_hash=file_hash,
            full_path=full_path,
            status=status,
            match_field=match_field
        )
        if not image_file:
            raise HTTPException(status_code=500, detail="Failed to upload file")          
        return {
            "success": True,
            "message": "File uploaded successfully, vectorization started",
            "data": image_file[0],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------------- #
# Endpoint: Remove File
# ----------------------------- #
@router.delete("/remove")
async def remove_file(
    data=Body(...),
    user=Depends(verify_token),
):
    if not user['permission'].get("knowledge"):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")

    company_id = user.get("company_id")
    file_id = data.get("file_id")

    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")

    company_schema = company_info["schema_name"]

    existing_file = get_same_documents_from_table_with_id(company_id=company_schema, file_id=file_id)
    if not existing_file:
        raise HTTPException(status_code=400, detail="File not found")

    file_info = existing_file[0]
    file_name, file_hash = file_info["file_name"], file_info["file_hash"]

    try:
        existing_file = get_same_documents_from_table(company_id=company_schema, file_hash=file_hash)
        if len(existing_file) > 1:
            deleting_file = delete_documents_from_table(company_id=company_schema, file_id=file_id)
            if not deleting_file:
                raise HTTPException(status_code=400, detail="Failed to delete database record")
            return {"message": "File removed successfully"}
        deleting_file = delete_documents_from_table(company_id=company_schema, file_id=file_id)
        if not deleting_file:
            raise HTTPException(status_code=400, detail="Failed to delete database record")
        
        file_path = file_info["full_path"]
        os.remove(file_path)
        return {"message": "File removed successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------------- #
# Endpoint: Reprocess File
# ----------------------------- #
@router.post("/reprocess")
async def reprocess_file(
    data=Body(...),
    user=Depends(verify_token),
):
    company_id = user.get("company_id")
    file_id = data.get("file_id")

    if not file_id:
        raise HTTPException(status_code=400, detail="file_id is required")

    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")

    company_schema = company_info["schema_name"]

    existing_file = get_same_documents_from_table_with_id(company_id=company_schema, file_id=file_id)
    if not existing_file:
        raise HTTPException(status_code=400, detail="File not found")

    file_info = existing_file[0]
    file_name, file_hash, match_field, full_path = file_info["file_name"], file_info["file_hash"], file_info["match_field"], file_info['full_path']

    try:
        existing_file = get_same_documents_from_table(company_id=company_schema, file_hash=file_hash)
        record_ids = []
        status = "Completed"
        if existing_file:
            for i in existing_file:
                if i['status'] == "Completed":
                    status = "Completed"
                record_ids.append(i['id'])
        if status != "Completed":
            # Check if file exists locally
            if not os.path.exists(full_path):
                raise HTTPException(status_code=404, detail="File not found locally")

            # Read file content as bytes
            with open(full_path, "rb") as f:
                file_content = f.read()
            file_hash = generate_file_hash(file_content)
        else:
            update_documents_status_on_table_by_hash(company_id=company_schema, file_hash=file_hash, status='Completed')

        return {
            "success": True,
            "message": "File reprocessing started successfully",
            "data": file_info,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Background processing failed: {str(e)}")
