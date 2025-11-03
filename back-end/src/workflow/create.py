from db.company_table import get_workflow_by_id
from db.company_table import get_all_messages, add_new_message
from src.response.ai_response import ai_response_with_search, ai_response_with_image_search
from utils.whatsapp import send_message_whatsapp
from langchain_core.runnables.history import RunnableWithMessageHistory
import datetime, json, time

def trigger_workflow_function(blocks: list[dict], company_schema: str, conversation_id: str, query: str, message_type: str):
    messages = get_all_messages(company_schema, conversation_id)
    flag = False
    for block in blocks:
        if block["key"] == "first_message" and flag == False:
            if len(messages) == 1:
                flag = True
            else:
                flag = False
        elif block["key"] == "incoming_Message" and flag == False:
            flag = True
        elif block["key"] == "message_filter.text":
            if block["settings"]["operator"] == "contains":
                if not block["settings"]["value"] in query:
                    return None
            elif block["settings"]["operator"] == "is":
                if block["settings"]["value"] != query:
                    return None
            elif block["settings"]["operator"] == "is_not":
                if block["settings"]["value"] == query:
                    return None
        elif block["key"] == "message_filter.type":
            if block["settings"]["operator"] == "is":
                if block["settings"]["value"] != message_type:
                    return None
            elif block["settings"]["operator"] == "is_not":
                if block["settings"]["value"] == message_type:
                    return None
    if flag:
        return messages
    else:
        return None

def condition_workflow_function(blocks: list[dict], from_phone_number: str, source_phone_number: str, messages: list[dict], query: str, message_type: str, platform:str):
    for block in blocks:
        if block["key"] == "message_filter.text":
            if block["settings"]["operator"] == "contains":
                if not block["settings"]["value"] in query:
                    return None
            elif block["settings"]["operator"] == "is":
                if block["settings"]["value"] != query:
                    return None
            elif block["settings"]["operator"] == "is not":
                if block["settings"]["value"] == query:
                    return None
        elif block["key"] == "message_filter.type":
            if block["settings"]["operator"] == "is":
                if block["settings"]["value"] != message_type:
                    return None
            elif block["settings"]["operator"] == "is not":
                if block["settings"]["value"] == message_type:
                    return None
        elif block["key"] == "message_count":
            if block["settings"]["operator"] == "is":
                if block["settings"]["value"] != len(messages):
                    return None
            elif block["settings"]["operator"] == "is gte":
                if block["settings"]["value"] < len(messages):
                    return None
            elif block["settings"]["operator"] == "is lte":
                if block["settings"]["value"] > len(messages):
                    return None
        elif block["key"] == "conversation_started":
            block_date = datetime.datetime.strptime(block["settings"]["value"], "%Y-%m-%d").date()
            conversation_started_date = messages[0]["created_at"].date()
            if block["settings"]["operator"] == "is":
                if block_date != conversation_started_date:
                    return None
            elif block["settings"]["operator"] == "is gte":
                if block_date < conversation_started_date:
                    return None
            elif block["settings"]["operator"] == "is lte":
                if block_date > conversation_started_date:
                    return None
        elif block["key"] == "platform":
            if block["settings"]["operator"] == "is":
                if block["settings"]["value"] != platform:
                    return None
            elif block["settings"]["operator"] == "is not":
                if block["settings"]["value"] == platform:
                    return None
        elif block["key"] == "integrated_phone_number":
            if block["settings"]["operator"] == "is":
                if block["settings"]["value"] != source_phone_number:
                    return None
            elif block["settings"]["operator"] == "is not":
                if block["settings"]["value"] == source_phone_number:
                    return None
        elif block["key"] == "customer_phone_number":
            if block["settings"]["operator"] == "is":
                if block["settings"]["value"] != from_phone_number:
                    return None
            elif block["settings"]["operator"] == "is not":
                if block["settings"]["value"] == from_phone_number:
                    return None
    return True

def delay_workflow_function(blocks: list[dict]):
    try:
        for block in blocks:
            if block["key"] == "delay":
                if block["settings"]["value"] > 0:
                    time.sleep(block["settings"]["value"])
                    pass
        return True
    except:
        return False

async def action_workflow_function(
    blocks: list[dict], 
    company_id: str, 
    company_schema:str, 
    conversation_id:str, 
    memory:RunnableWithMessageHistory, 
    from_phone_number: str,
    instance_name:str, 
    query: str,
    message_type:str,
    platform:str,
    image_search_result:list[dict]
):
    final_response = []
    for block in blocks:
        if block["key"] == "ai_reply":
            if message_type == "Image" and image_search_result:
                ai_response, extra_info = await ai_response_with_image_search(company_id, company_schema, conversation_id, query, memory, image_search_result)
            else:
                ai_response, extra_info = await ai_response_with_search(company_id, company_schema, conversation_id, query, memory)
            if platform == "WhatsApp":
                result = await send_message_whatsapp(instance_name, from_phone_number, ai_response, extra_info)
                if not result.get("success", False):
                    return False
            # Insert new message into database        
            add_response = add_new_message(
                company_id=company_schema, 
                conversation_id=conversation_id, 
                sender_email="",
                sender_type="bot", 
                content=ai_response,
                extra=json.dumps(extra_info)
            )
            
            if not add_response:
                return False
            final_response.append(add_response[0])
            
        elif block["key"] == "send_message":
            if platform == "WhatsApp":
                result = await send_message_whatsapp(instance_name, from_phone_number, block["settings"]["value"], {'images': []})
                if not result.get("success", False):
                    return False
            # Insert new message into database        
            add_response = add_new_message(
                company_id=company_schema, 
                conversation_id=conversation_id, 
                sender_email="",
                sender_type="bot", 
                content=block["settings"]["value"],
                extra=json.dumps({"images": []})
            )
            
            if not add_response:
                return False
            final_response.append(add_response[0])
    return final_response