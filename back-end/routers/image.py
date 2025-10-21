from fastapi import APIRouter, HTTPException, Depends, UploadFile, Body, File, Query, Form
from middleware.auth import verify_token
from db.supabase_client import supabase
from src.image_vectorize import store_image_embedding, delete_image_embedding
from src.utils.file_utills import generate_file_hash
from db.public_table import get_companies
from db.company_table import *
import io, asyncio, threading

router = APIRouter()

# ----------------------------- #
# Utility: Background Vectorizer
# ----------------------------- #
def run_vectorize_in_thread(file_content, file_name, file_hash, company_id, record_id, company_schema, match_field):
    """Run vectorization asynchronously inside a separate thread."""
    asyncio.run(vectorize_in_background(file_content, file_name, file_hash, company_id, record_id, company_schema, match_field))


async def vectorize_in_background(file_content: bytes, file_name: str, file_hash: str, company_id: str, record_id: str, company_schema:str, match_field:str):
    """Handles background image embedding creation."""
    try:
        file_io = io.BytesIO(file_content)
        result = store_image_embedding(
            image_bytes=file_io,
            file_name=file_name,
            file_hash=file_hash,
            index_name=f'{company_id}-image',
            match_field=match_field
        )
        
        # Update database record status
        if result:
            await update_image_status_on_table(company_id=company_schema, file_id=record_id, status='Completed')
        else:
            await update_image_status_on_table(company_id=company_schema, file_id=record_id, status='Failed')
    except Exception as e:
        print(f"Vectorization failed: {str(e)}")
        await update_image_status_on_table(company_id=company_schema, file_id=record_id, status='Failed')

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
        files = await get_images_from_table(company_schema, page_size, page_start)
        if files["status"] != "success":
            raise HTTPException(status_code=500, detail=files['message'])

        count = await get_all_image_from_table(company_schema)
        return {
            "status": "success",
            "company_id": company_id,
            "images": files["rows"],
            "total": count["rows"][0]["count"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------------- #
# Endpoint: Upload File
# ----------------------------- #
@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    match_field = Form(...),
    user=Depends(verify_token),
):
    if not user['permission'].get("knowledge"):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")

    company_id = user.get("company_id")
    if not file or not company_id:
        raise HTTPException(status_code=400, detail="No file provided")

    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")

    company_schema = company_info["schema_name"]

    try:
        file_content = await file.read()
        file_name = file.filename
        file_hash = generate_file_hash(file_content)

        existing_file = await get_same_image_from_table(company_id=company_schema, file_hash=file_hash)
        if existing_file["status"] == "success" and existing_file.get("rows"):
            raise HTTPException(status_code=400, detail="File already exists")

        supabase.storage.from_("images").upload(
            f"{company_id}/{file_name}", file_content, {"content-type": file.content_type}
        )

        image_file = await add_new_image(
            company_id=company_schema,
            file_name=file_name,
            file_type=file.content_type,
            file_hash=file_hash,
            status="Processing",
            match_field=match_field
        )

        if image_file["status"] != "success":
            raise HTTPException(status_code=500, detail="Failed to upload file")

        record_id = image_file["rows"][0]["id"]

        # Start vectorization asynchronously
        thread = threading.Thread(
            target=run_vectorize_in_thread,
            args=(file_content, file_name, file_hash, company_id, record_id, company_schema, match_field),
            daemon=True,
        )
        thread.start()

        return {
            "success": True,
            "message": "File uploaded successfully, vectorization started",
            "data": image_file["rows"][0],
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

    existing_file = await get_same_image_from_table_with_id(company_id=company_schema, file_id=file_id)
    if existing_file["status"] != "success" or not existing_file.get("rows"):
        raise HTTPException(status_code=400, detail="File not found")

    file_info = existing_file["rows"][0]
    file_name, file_hash = file_info["file_name"], file_info["file_hash"]

    try:
        delete_image_embedding(f"{company_id}-image", file_hash)
        deleting_file = await delete_image_from_table(company_id=company_schema, file_id=file_id)
        if deleting_file["status"] != "success":
            raise HTTPException(status_code=400, detail="Failed to delete database record")

        response = supabase.storage.from_("images").remove([f"{company_id}/{file_name}"])
        return {"message": "File removed successfully", "data": response}

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

    existing_file = await get_same_image_from_table_with_id(company_id=company_schema, file_id=file_id)
    if existing_file["status"] != "success" or not existing_file.get("rows"):
        raise HTTPException(status_code=400, detail="File not found")

    file_info = existing_file["rows"][0]
    file_name, record_id, match_field = file_info["file_name"], file_info["id"], file_info["match_field"]

    try:
        file_response = supabase.storage.from_("images").download(f"{company_id}/{file_name}")
        if not file_response:
            raise HTTPException(status_code=404, detail="File not found in storage")

        file_content = file_response
        file_hash = generate_file_hash(file_content)

        thread = threading.Thread(
            target=run_vectorize_in_thread,
            args=(file_content, file_name, file_hash, company_id, record_id, company_schema, match_field),
            daemon=True,
        )
        thread.start()

        return {
            "success": True,
            "message": "File reprocessing started successfully",
            "data": file_info,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Background processing failed: {str(e)}")
