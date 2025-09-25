from utils.supabase_client import supabase
from typing import Optional, Dict, Any

async def create_project(user_id: str, name: str, description: str) -> Dict[str, Any]:
    """Create a new project"""
    try:
        response = supabase.table('projects').insert({
            'user_id': user_id,
            'name': name,
            'description': description
        }).execute()
        
        return {"data": response.data, "error": None}
    except Exception as e:
        return {"data": None, "error": str(e)}

async def get_projects_by_user_id(user_id: str) -> Dict[str, Any]:
    """Get all projects for a user"""
    try:
        response = supabase.table('projects').select('*').eq('user_id', user_id).execute()
        return {"data": response.data, "error": None}
    except Exception as e:
        return {"data": None, "error": str(e)}