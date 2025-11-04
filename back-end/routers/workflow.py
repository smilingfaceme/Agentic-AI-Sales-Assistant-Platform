from fastapi import APIRouter, HTTPException, Depends, Body, Query, Form, File, UploadFile
from middleware.auth import verify_token
from db.company_table import add_new_workflow, get_all_workflows, get_workflow_by_id, update_workflow_by_id, delete_workflow_by_id, update_workflow_for_enable_except_by_id
from db.public_table import get_companies
from src.workflow.confirm import confirm_workflows
import json, os
from typing import Optional, List

router = APIRouter()

@router.post("/create")
async def create_workflow(
    name: str = Form(...), 
    nodes: str = Form(...),
    edges: str = Form(...),
    files: Optional[List[UploadFile]] = File(None),
    user = Depends(verify_token)
):
    if not user['permission'].get("workflow", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    
    company_id = user["company_id"]
    if not name or not nodes or not company_id:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")
    company_schema = company_info["schema_name"]
    
    nodes = json.loads(nodes)
    edges = json.loads(edges)
    result, warning_message = confirm_workflows({"nodes":nodes, 'edges':edges})
    status = "Success" if result else "Error"
    new_record = add_new_workflow(company_schema, name, json.dumps(nodes), json.dumps(edges), status)
    if new_record:
        if files:
            for file in files:
                file_name = file.filename
                file_content = await file.read()
                save_dir = os.path.join("files", "workflows", str(company_id), str(new_record[0]['id']))
                os.makedirs(save_dir, exist_ok=True)

                # Build full path for the file
                full_path = os.path.join(save_dir, file_name)

                # Save the file locally
                with open(full_path, "wb") as f:
                    f.write(file_content)
        if not result:
            return {
                "status": 'failed',
                "message": warning_message,
                "workflow": new_record[0]
            }
        return {
            "status": 'success',
            "workflow": new_record[0]
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to create workflow")

@router.get("/list")
async def get_workflow_list(user = Depends(verify_token)):
    if not user['permission'].get("workflow", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    company_id = user["company_id"]
    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")
    company_schema = company_info["schema_name"]
    workflows = get_all_workflows(company_schema)
    return {
        "status": 'success',
        "workflows": workflows
    }

@router.get("/get")
async def get_workflow(workflow_id: str = Query(...), user = Depends(verify_token)):
    if not user['permission'].get("workflow", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    company_id = user["company_id"]
    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")
    company_schema = company_info["schema_name"]
    workflow = get_workflow_by_id(company_schema, workflow_id)
    return {
        "status": 'success',
        "workflow": workflow[0]
    }

@router.put("/update")
async def update_workflow(
    name: str = Form(...), 
    nodes: str = Form(...),
    edges: str = Form(...),
    workflow_id: str = Form(...), 
    files: Optional[List[UploadFile]] = File(None),
    user = Depends(verify_token)
):
    if not user['permission'].get("workflow", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    company_id = user["company_id"]
    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")
    company_schema = company_info["schema_name"]
    
    if not workflow_id or not name or not nodes:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    nodes = json.loads(nodes)
    edges = json.loads(edges)
    workflow = get_workflow_by_id(company_schema, workflow_id)
    if not workflow:
        raise HTTPException(status_code=400, detail="Workflow not found")
    result, warning_message = confirm_workflows({"nodes":nodes, 'edges':edges})
    status = "Success" if result else "Error"
    updated_workflow = update_workflow_by_id(company_schema, workflow_id, name, json.dumps(nodes), json.dumps(edges), status)
    if updated_workflow:
        if files:
            for file in files:
                file_name = file.filename
                file_content = await file.read()
                save_dir = os.path.join("files", "workflows", str(company_id), str(workflow_id))
                os.makedirs(save_dir, exist_ok=True)

                # Build full path for the file
                full_path = os.path.join(save_dir, file_name)

                # Save the file locally
                with open(full_path, "wb") as f:
                    f.write(file_content)
        if not result:
            return {
                "status": 'failed',
                "message": warning_message,
                "workflow": updated_workflow[0]
            }
        return {
            "status": 'success',
            "workflow": updated_workflow[0]
        }
    else:
        raise HTTPException(status_code=400, detail=warning_message) 

@router.delete("/delete")
async def delete_workflow(data = Body(...), user = Depends(verify_token)):
    if not user['permission'].get("workflow", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    workflow_id = data['workflow_id']
    company_id = user["company_id"]
    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")
    company_schema = company_info["schema_name"]
    workflow = get_workflow_by_id(company_schema, workflow_id)
    if not workflow:
        raise HTTPException(status_code=400, detail="Workflow not found")
    
    deleted_workflow = delete_workflow_by_id(company_schema, workflow_id)
    if deleted_workflow:
        return {
            "status": 'success',
            "message": "Workflow deleted successfully"
        }
    
    raise HTTPException(status_code=500, detail="Failed to delete workflow")

@router.put("/toggle-enable")
async def update_workflow(data = Body(...), user = Depends(verify_token)):
    if not user['permission'].get("workflow", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    company_id = user["company_id"]
    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")
    company_schema = company_info["schema_name"]
    workflow_id = data["workflow_id"]
    if not workflow_id:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    workflow = get_workflow_by_id(company_schema, workflow_id)
    if not workflow:
        raise HTTPException(status_code=400, detail="Workflow not found")
    updated_workflow = update_workflow_for_enable_except_by_id(company_schema, workflow_id, not workflow[0]['enable_workflow'], workflow[0]['except_case'])
    if updated_workflow:
        return {
            "status": 'success',
            "workflow": updated_workflow[0]
        }
    
    raise HTTPException(status_code=500, detail="Failed to update workflow")

@router.put("/except-case")
async def update_workflow(data = Body(...), user = Depends(verify_token)):
    if not user['permission'].get("workflow", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    company_id = user["company_id"]
    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")
    company_schema = company_info["schema_name"]
    workflow_id = data["workflow_id"]
    except_case = data["except_case"]
    if not workflow_id:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    workflow = get_workflow_by_id(company_schema, workflow_id)
    if not workflow:
        raise HTTPException(status_code=400, detail="Workflow not found")
    updated_workflow = update_workflow_for_enable_except_by_id(company_schema, workflow_id, workflow[0]['enable_workflow'], except_case)
    if updated_workflow:
        return {
            "status": 'success',
            "workflow": updated_workflow[0]
        }
    raise HTTPException(status_code=500, detail="Failed to update workflow")