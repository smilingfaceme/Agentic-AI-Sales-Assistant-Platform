from fastapi import APIRouter, HTTPException, Depends, Query, Body
from middleware.auth import verify_token
from utils.supabase_client import supabase

router = APIRouter()

@router.get("/")
async def get_conversations(
    project_id: str = Query(...),
    user = Depends(verify_token)
):
    if not project_id:
        raise HTTPException(status_code=400, detail="Missing project_id parameter")
    
    try:
        response = supabase.table('conversations').select('*').eq('project_id', project_id).execute()
        return {"conversations": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/unanswered")
async def get_unanswered_questions(
        project_id:str = Query(...),
        user = Depends(verify_token)
    ):
    # try:
    response = supabase.rpc('get_last_unanswered_message_by_project', {"p_project_id": project_id}).execute()
    return {"messages": response.data}
    # except Exception as e:
    #     raise HTTPException(status_code=500, detail=str(e))

@router.post("/create")
async def create_new_conversation(
    user = Depends(verify_token),
    project_id:str = Body(...),
    conversation_name:str = Body(...),
    source:str = Body(...),
    ):
    data = {
        'project_id': project_id,
        'source': source,
        'conversation_name': conversation_name
        }
    
    try:
        response = supabase.table('conversations').insert([data]).execute()
        return {"conversations": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))