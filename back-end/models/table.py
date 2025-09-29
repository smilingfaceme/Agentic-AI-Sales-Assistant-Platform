from utils.supabase_client import supabase
from models.schema import *

async def create_public_tables():
    response = supabase.rpc("exec_sql", {"sql": PUBLIC_COMPANIES_TABLE}).execute()
    response = supabase.rpc("exec_sql", {"sql": PUBLIC_ROLES_TABLE}).execute()
    response = supabase.rpc("exec_sql", {"sql": PUBLIC_USERS_TABLE}).execute()
    response = supabase.rpc("exec_sql", {"sql": PUBLIC_INVITATIONS_TABLE}).execute()