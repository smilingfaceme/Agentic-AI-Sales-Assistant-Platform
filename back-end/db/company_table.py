from db.supabase_client import supabase
from models.schema import *

async def create_company_tables(company_id: str):
    response = supabase.rpc("exec_sql", {"sql": f'{COMPNY_SCHEMA_CREATE.format(company_id=company_id)}\n{COMPANY_CONVERSATION_TABLE.format(company_id=company_id)}\n{COMPANY_MESSAGE_TABLE.format(company_id=company_id)}'}).execute()
    return response

async def add_new_conversation(company_id: str, conversation_name: str, source: str, phone_number: str, instance_name:str=""):
    response = supabase.rpc("exec_sql", {"sql": ADD_CONVERSATION_INTO_TABLE.format(company_id=company_id, conversation_name=conversation_name, source=source, phone_number=phone_number, instance_name=instance_name)}).execute()
    return response.data

async def get_all_conversations(company_id: str):
    response = supabase.rpc("exec_sql", {"sql": GET_ALL_CONVERSATIONS_QUERY.format(company_id=company_id)}).execute()
    return response.data

async def get_conversation_by_id(company_id: str, conversation_id: str):
    response = supabase.rpc("exec_sql", {"sql": GET_CONVERSATION_WITH_ID_QUERY.format(company_id=company_id, conversation_id=conversation_id)}).execute()
    return response.data

async def get_conversatin_by_phone_integration(company_id: str, phone_number: str, instance_name:str):
    response = supabase.rpc("exec_sql", {"sql": GET_CONVERSATION_WITH_PHONE_INTEGRATION_QUERY.format(company_id=company_id, phone_number=phone_number, instance_name=instance_name)}).execute()
    return response.data

async def add_new_message(company_id: str, conversation_id:str, sender_type:str, sender_email:str, content:str):
    response = supabase.rpc("exec_sql", {"sql": UPDATE_MESSAGE_BY_ID_QUERY.format(company_id=company_id, conversation_id=conversation_id, sender_type=sender_type, sender_email=sender_email, content=content)}).execute()
    return response.data

async def get_unanswered_conversations(company_id: str):
    response = supabase.rpc("exec_sql", {"sql": GET_UNANSWERED_CONVERSATIONS_QUERY.format(company_id=company_id)}).execute()
    return response.data

async def get_all_messages(company_id: str, conversation_id: str):
    response = supabase.rpc("exec_sql", {"sql": GET_MESSAGES_BY_CONVERSATION_ID_QUERY.format(company_id=company_id, conversation_id=conversation_id)}).execute()
    return response.data
