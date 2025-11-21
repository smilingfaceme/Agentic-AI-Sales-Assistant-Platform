from db.company_table import get_workflow_by_id
from db.company_table import get_all_messages, add_new_message
from db.public_table import get_integration_by_phone_number_id, get_integration_by_instance_name
from src.response.ai_response import ai_response_with_search, ai_response_with_image_search
from utils.whatsapp import send_message_whatsapp
from utils.waca import send_text_message_by_waca, send_image_message_by_waca
from utils.send_email_without_smtp import send_email_with_customize_content
from langchain_core.runnables.history import RunnableWithMessageHistory
import datetime, json, time, os

image_extensions = {'xbm', 'tif', 'jfif', 'pjp', 'apng', 'jpeg', 'heif', 'ico', 'tiff', 'webp', 'svgz', 'jpg', 'heic', 'gif', 'svg', 'png', 'bmp', 'pjpeg', 'avif'}

def get_workflow_attachment(extra_attachment:str, company_id: str, workflow_id: str):
    attachments_files = {"images": [], "extra": []}
    if not extra_attachment:
        return None
    save_dir = os.path.join("files", "workflows", str(company_id), str(workflow_id))
    attachments = extra_attachment.split(",")
    # Build full path for the file
    for file in attachments:
        file_name = file.strip()
        file_extension = file_name.split(".")[-1]
        full_path = os.path.join(save_dir, file_name)
        if os.path.exists(full_path):
           if file_extension.lower() in image_extensions:
                attachments_files["images"].append(full_path)
           else:
                attachments_files["extra"].append(full_path)
        
    return attachments_files

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
    if flag:
        return messages
    else:
        return False

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
    workflow_id:str,
    image_search_result:list[dict]
):
    # Get integration details based on platform
    if platform == "WACA":
        integration = get_integration_by_phone_number_id(instance_name)
        api_key = integration.get("instance_name", None)
        phone_number_id = instance_name
    else:
        api_key = None
        phone_number_id = None

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
            elif platform == "WACA":
                # Send message via WhatsApp Business API
                if extra_info.get("images") or extra_info.get("extra"):
                    result = send_image_message_by_waca(api_key, phone_number_id, from_phone_number, ai_response, extra_info)
                else:
                    result = send_text_message_by_waca(api_key, phone_number_id, from_phone_number, ai_response)
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
            content = block["settings"]["value_0"]
            extra_attachment = block["settings"].get("value_1", "")
            extra_files = get_workflow_attachment(extra_attachment, company_id, workflow_id)
            if platform == "WhatsApp":
                result = await send_message_whatsapp(instance_name, from_phone_number, content, extra_files)
                if not result.get("success", False):
                    return False
            elif platform == "WACA":
                # Send message via WhatsApp Business API
                if extra_files and (extra_files.get("images") or extra_files.get("extra")):
                    result = send_image_message_by_waca(api_key, phone_number_id, from_phone_number, content, extra_files)
                else:
                    result = send_text_message_by_waca(api_key, phone_number_id, from_phone_number, content)
                if not result.get("success", False):
                    return False
            # Insert new message into database
            add_response = add_new_message(
                company_id=company_schema, 
                conversation_id=conversation_id, 
                sender_email="",
                sender_type="bot", 
                content=content,
                extra=json.dumps(extra_files)
            )
            
            if not add_response:
                return False
            final_response.append(add_response[0])
        elif block["key"] == "book_meeting":
            content = f'Please book a meeting on this: {block["settings"]["value"]}'
            if platform == "WhatsApp":
                result = await send_message_whatsapp(instance_name, from_phone_number, content, {"images":[], "extra":[]})
                if not result.get("success", False):
                    return False
            # Insert new message into database
            add_response = add_new_message(
                company_id=company_schema, 
                conversation_id=conversation_id, 
                sender_email="",
                sender_type="bot", 
                content=content,
                extra=json.dumps({"images":[], "extra":[]})
            )
            
            if not add_response:
                return False
            final_response.append(add_response[0])
        elif block["key"] == "send_email":
            receiver_email = block["settings"]["value_0"]
            content = block["settings"]["value_1"]
            extra_attachment = block["settings"].get("value_2", "")
            extra_files = get_workflow_attachment(extra_attachment, company_id, workflow_id)
            if not send_email_with_customize_content(receiver_email, content, extra_files):
                return False
    return final_response