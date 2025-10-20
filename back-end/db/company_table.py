from db.supabase_client import supabase
from models.schema import *

async def create_company_tables(company_id: str):
    response = supabase.rpc("exec_sql", {"sql": f'{COMPNY_SCHEMA_CREATE.format(company_id=company_id)}\n{COMPANY_CONVERSATION_TABLE.format(company_id=company_id)}\n{COMPANY_MESSAGE_TABLE.format(company_id=company_id)}\n{COMPANY_IMAGE_TABLE.format(company_id=company_id)}'}).execute()
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

async def add_new_message(company_id: str, conversation_id:str, sender_type:str, sender_email:str, content:str, extra:str):
    print(UPDATE_MESSAGE_BY_ID_QUERY.format(company_id=company_id, conversation_id=conversation_id, sender_type=sender_type, sender_email=sender_email, content=content, extra=extra))
    response = supabase.rpc("exec_sql", {"sql": UPDATE_MESSAGE_BY_ID_QUERY.format(company_id=company_id, conversation_id=conversation_id, sender_type=sender_type, sender_email=sender_email, content=content, extra=extra)}).execute()
    return response.data

async def get_unanswered_conversations(company_id: str):
    response = supabase.rpc("exec_sql", {"sql": GET_UNANSWERED_CONVERSATIONS_QUERY.format(company_id=company_id)}).execute()
    return response.data

async def get_all_messages(company_id: str, conversation_id: str):
    response = supabase.rpc("exec_sql", {"sql": GET_MESSAGES_BY_CONVERSATION_ID_QUERY.format(company_id=company_id, conversation_id=conversation_id)}).execute()
    return response.data

async def add_new_image(company_id:str, file_name:str, file_type:str, file_hash:str, status: str):
    response = supabase.rpc("exec_sql", {"sql": ADD_IMAGE_INTO_TABLE.format(company_id=company_id, file_name=file_name, file_type=file_type, file_hash=file_hash, status=status)}).execute()
    return response.data

async def get_images_from_table(company_id:str, page_size:int = 50, page_start:int = 0):
    response = supabase.rpc("exec_sql", {"sql": GET_IMAGES_FROM_TABLE.format(company_id=company_id, page_size=page_size, page_start=page_start)}).execute()
    return response.data

async def get_all_image_from_table(company_id:str):
    response = supabase.rpc("exec_sql", {"sql": GET_ALL_IMAGE_TABLE.format(company_id=company_id)}).execute()
    return response.data

async def get_same_image_from_table(company_id:str, file_hash:str):
    response = supabase.rpc("exec_sql", {"sql": GET_SAME_IMAGE_TABLE.format(company_id=company_id, file_hash=file_hash)}).execute()
    return response.data

async def get_same_image_from_table_with_id(company_id:str, file_id:str):
    response = supabase.rpc("exec_sql", {"sql": GET_SAME_IMAGE_TABLE_WITH_ID.format(company_id=company_id, file_id=file_id)}).execute()
    return response.data

async def delete_image_from_table(company_id:str, file_id:str):
    response = supabase.rpc("exec_sql", {"sql": DELETE_IMAGE_TABLE.format(company_id=company_id, file_id=file_id)}).execute()
    return response.data

async def update_image_status_on_table(company_id:str, file_id:str, status:str):
    response = supabase.rpc("exec_sql", {"sql": UPDATE_IMAGE_STATUS_TABLE.format(company_id=company_id, file_id=file_id, status=status)}).execute()
    return response.data