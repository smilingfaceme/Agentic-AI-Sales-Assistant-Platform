from db.company_table import get_all_workflows, get_all_messages, get_linked_images_from_table, add_new_message, update_message_energy
from db.public_table import get_chatbot_personality, get_integration_by_instance_name, get_integration_by_phone_number_id
from src.utils.chroma_utils import search_vectors_product
from src.workflow.create import trigger_workflow_function, condition_workflow_function, action_workflow_function, delay_workflow_function
from src.response.ai_response import ai_response_with_search, ai_response_with_image_search, combine_all_response_into_one
from utils.whatsapp import send_message_whatsapp
from utils.waca import send_text_message_by_waca, send_image_message_by_waca
from src.image_vectorize import search_similar_images
from utils.track_carbon import tracker
from langchain_openai import ChatOpenAI
from langchain_core.tools import StructuredTool
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain.agents import create_agent
from pydantic import BaseModel, Field
from concurrent.futures import ThreadPoolExecutor
import os, asyncio, json, io

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
llm_bot = ChatOpenAI(
    model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    api_key=OPENAI_KEY,
)

extra_info_conversations = {}
def get_workflows(company_schema: str):
    workflows = get_all_workflows(company_schema)
    if len(workflows) == 0:
        return None
    active_worflows = [workflow for workflow in workflows if workflow["status"] == "Success" and workflow["enable_workflow"] == True]
    return active_worflows

async def get_history(messages):
    memory = InMemoryChatMessageHistory()
    if messages:
        for m in messages:
            if m["sender_type"] == "customer":
                memory.add_user_message(m["content"])
            else:
                memory.add_ai_message(m["content"])
    return memory

async def generate_response_with_search(
    company_id: str, company_schema: str, conversation_id: str, query: str, from_phone_number: str, instance_name: str, message_type:str, platform:str
):
    tracker.start()

    # Get integration details based on platform
    if platform == "WACA":
        integration = get_integration_by_phone_number_id(instance_name)
        source_phone_number = integration.get("phone_number", None)
        api_key = integration.get("instance_name", None)
        phone_number_id = instance_name
    else:
        integration = get_integration_by_instance_name(instance_name)
        source_phone_number = integration.get("phone_number", None)
        api_key = None
        phone_number_id = None
    active_workflows = get_workflows(company_schema)
    
    except_case = []
    active_workflows_response = []
    if active_workflows:
        print("Pass Workflow Processing")
        for workflow in active_workflows:
            worflow_process_flag = True
            messages = []
            memory = await get_history(messages)
            for node in workflow["nodes"]:
                print("Pass each nodes Processing")
                if node["type"] == "trigger":
                    print("Pass trigger nodes Processing")
                    if node.get("config", {}).get("blocks", []):
                        result = trigger_workflow_function(node["config"]["blocks"], company_schema, conversation_id, query, message_type)
                        if not result or len(result) == 0:
                            worflow_process_flag = False
                            break
                        messages = result
                        memory = await get_history(messages)
                if node["type"] == "condition":
                    print("Pass condition nodes Processing")
                    if node.get("config", {}).get("blocks", []):
                        result = condition_workflow_function(node["config"]["blocks"], from_phone_number, source_phone_number, messages, query, message_type, platform, company_schema, conversation_id)
                        if not result:
                            worflow_process_flag = False
                            break
                if node["type"] == "action":
                    print("Pass action nodes Processing")
                    if node.get("config", {}).get("blocks", []):
                        workflow_response = await action_workflow_function(node["config"]["blocks"],company_id, company_schema, conversation_id, memory, from_phone_number, instance_name, query, message_type, platform, workflow["id"], [])
                        if workflow_response:
                            active_workflows_response.extend(workflow_response)
                if node["type"] == "delay":
                    print("Pass delay nodes Processing")
                    if node.get("config", {}).get("blocks", []):
                        result = delay_workflow_function(node["config"]["blocks"])
            if not worflow_process_flag:
                except_case.append(workflow["except_case"])
    else:
        except_case.append("sample")
    except_case = list(set(except_case))
    for i in except_case:
        if i == "sample":
            messages = get_all_messages(company_schema, conversation_id)
            memory = await get_history(messages)
            final_response, extra_info = await ai_response_with_search(company_id, company_schema, conversation_id, query, memory, [])
            active_workflows_response.append([final_response, extra_info])
        elif i == "move":
            pass
        elif i == "ignore":
            pass
    
    if len(active_workflows_response) > 1:
        responses = [i[0] for i in active_workflows_response]
        final_combine_response = await combine_all_response_into_one(company_id, conversation_id, memory, responses)
        images = []
        extra = []
        for i in active_workflows_response:
            images.extend(i[1].get("images", []))
            extra.extend(i[1].get("extra", []))
        final_combine_extra_files = {"images": list(set(images)), "extra":list(set(extra))}
    else:
        final_combine_response = active_workflows_response[0][0]
        final_combine_extra_files = active_workflows_response[0][1]
    store_message = True
    if platform == "WhatsApp":
        result = await send_message_whatsapp(instance_name, from_phone_number, final_combine_response, final_combine_extra_files)
        if not result.get("success", False):
            store_message = False
    elif platform == "WACA":
        # Send message via WhatsApp Business API
        if final_combine_extra_files and (final_combine_extra_files.get("images") or final_combine_extra_files.get("extra")):
            result = send_image_message_by_waca(api_key, phone_number_id, from_phone_number, final_combine_response, final_combine_extra_files)
        else:
            result = send_text_message_by_waca(api_key, phone_number_id, from_phone_number, final_combine_response)
        if not result.get("success", False):
            store_message = False
    if store_message:
        add_response = add_new_message(
            company_id=company_schema, 
            conversation_id=conversation_id, 
            sender_email="",
            sender_type="bot", 
            content=final_combine_response,
            extra=json.dumps(final_combine_extra_files)
        )
        active_workflows_response = [add_response[0]]
    
    emissions_kg = tracker.stop()
    energy_kwh = tracker.final_emissions_data.energy_consumed
    update_message_energy(company_schema, conversation_id, energy_kwh, emissions_kg)
    return active_workflows_response

async def generate_response_with_image_search(
    company_id: str, company_schema: str, conversation_id: str, query: str, from_phone_number: str, instance_name: str, message_type:str, platform:str, sample_image: io.BytesIO
):
    tracker.start()
    matches = search_similar_images(query_image_bytes=sample_image, index_name=f'{company_id}-image')

    # Get integration details based on platform
    if platform == "WACA":
        integration = get_integration_by_phone_number_id(instance_name)
        source_phone_number = integration.get("phone_number", None)
        api_key = integration.get("instance_name", None)
        phone_number_id = instance_name
    else:
        integration = get_integration_by_instance_name(instance_name)
        source_phone_number = integration.get("phone_number", None)
        api_key = None
        phone_number_id = None
    active_workflows = get_workflows(company_schema)
    
    except_case = []
    active_workflows_response = []
    if active_workflows:
        for workflow in active_workflows:
            worflow_process_flag = True
            messages = []
            memory = await get_history(messages)
            for node in workflow["nodes"]:
                if node["type"] == "trigger":
                    result = trigger_workflow_function(node["config"]["blocks"], company_schema, conversation_id, query, message_type)
                    if not result or len(messages) > 0:
                        worflow_process_flag = False
                        break
                    messages = result
                    memory = await get_history(messages)
                if node["type"] == "condition":
                    result = condition_workflow_function(node["config"]["blocks"], from_phone_number, source_phone_number, messages, query, message_type, platform, company_schema, conversation_id)
                    if not result:
                        worflow_process_flag = False
                        break
                if node["type"] == "action":
                    workflow_response = await action_workflow_function(node["config"]["blocks"],company_id, company_schema, conversation_id, memory, from_phone_number, instance_name, query, message_type, platform, workflow["id"], matches)
                    if workflow_response:
                        active_workflows_response.extend(workflow_response)
                if node["type"] == "delay":
                    result = delay_workflow_function(node["config"]["blocks"])
            if not worflow_process_flag:
                except_case.append(workflow["except_case"])
    else:
        except_case.append("sample")
    except_case = list(set(except_case))
    except_response = []
    for i in except_case:
        if i == "sample":
            # Get chat history
            messages = get_all_messages(company_schema, conversation_id)
            memory = await get_history(messages)
            
            final_response, extra_info = await ai_response_with_image_search(company_id, company_schema, conversation_id, query, memory, matches)
            active_workflows_response.append([final_response, extra_info])
        elif i == "move":
            pass
        elif i == "ignore":
            pass
    print(active_workflows_response)
    if len(active_workflows_response) > 1:
        responses = [i[0] for i in active_workflows_response]
        final_combine_response = await combine_all_response_into_one(company_id, conversation_id, memory, responses)
        images = []
        extra = []
        for i in active_workflows_response:
            images.extend(i[1].get("images", []))
            extra.extend(i[1].get("extra", []))
        final_combine_extra_files = {"images": list(set(images)), "extra":list(set(extra))}
    else:
        final_combine_response = active_workflows_response[0][0]
        final_combine_extra_files = active_workflows_response[0][1]
    store_message = True
    if platform == "WhatsApp":
        result = await send_message_whatsapp(instance_name, from_phone_number, final_combine_response, final_combine_extra_files)
        if not result.get("success", False):
            store_message = False
    elif platform == "WACA":
        # Send message via WhatsApp Business API
        if final_combine_extra_files and (final_combine_extra_files.get("images") or final_combine_extra_files.get("extra")):
            result = send_image_message_by_waca(api_key, phone_number_id, from_phone_number, final_combine_response, final_combine_extra_files)
        else:
            result = send_text_message_by_waca(api_key, phone_number_id, from_phone_number, final_combine_response)
        if not result.get("success", False):
            store_message = False
    if store_message:
        add_response = add_new_message(
            company_id=company_schema, 
            conversation_id=conversation_id, 
            sender_email="",
            sender_type="bot", 
            content=final_combine_response,
            extra=json.dumps(final_combine_extra_files)
        )
        active_workflows_response = [add_response[0]]    
    emissions_kg = tracker.stop()
    energy_kwh = tracker.final_emissions_data.energy_consumed
    update_message_energy(company_schema, conversation_id, energy_kwh, emissions_kg)
    
    return active_workflows_response