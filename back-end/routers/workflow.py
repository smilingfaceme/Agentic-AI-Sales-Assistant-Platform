from fastapi import APIRouter, HTTPException, Depends, Body, Query
from middleware.auth import verify_token
from db.company_table import add_new_workflow, get_all_workflows, get_workflow_by_id, update_workflow_by_id, delete_workflow_by_id
from db.public_table import get_companies
import json

router = APIRouter()

@router.post("/create")
async def create_workflow(data = Body(...), user = Depends(verify_token)):
    if not user['permission'].get("workflow", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    name = data["name"]
    nodes = data["nodes"]
    edges = data["edges"]
    company_id = user["company_id"]
    if not name or not nodes or not edges or not company_id:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")

    company_schema = company_info["schema_name"]
    
    new_record = add_new_workflow(company_schema, name, json.dumps(nodes), json.dumps(edges), "Active")
    
    if new_record:
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
async def update_workflow(data = Body(...), user = Depends(verify_token)):
    if not user['permission'].get("workflow", False):
        raise HTTPException(status_code=400, detail="You are not authorized to perform this action")
    company_id = user["company_id"]
    company_info = get_companies("id", company_id)
    if not company_info:
        raise HTTPException(status_code=400, detail="Company not found")
    company_schema = company_info["schema_name"]
    workflow_id = data["workflow_id"]
    name = data["name"]
    nodes = data["nodes"]
    edges = data["edges"]
    if not workflow_id or not name or not nodes or not edges:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    workflow = get_workflow_by_id(company_schema, workflow_id)
    if not workflow:
        raise HTTPException(status_code=400, detail="Workflow not found")
    
    updated_workflow = update_workflow_by_id(company_schema, workflow_id, name, json.dumps(nodes), json.dumps(edges), 'Active')
    if updated_workflow:
        return {
            "status": 'success',
            "workflow": updated_workflow[0]
        }
    
    raise HTTPException(status_code=500, detail="Failed to update workflow")

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