from db.company_table import get_all_workflows, get_all_messages, get_linked_images_from_table, add_new_message, update_message_energy
from db.public_table import get_chatbot_personality, get_integration_by_instance_name
from src.utils.chroma_utils import search_vectors_product
from src.workflow.create import trigger_workflow_function, condition_workflow_function, action_workflow_function, delay_workflow_function
from src.response.ai_response import ai_response_with_search, ai_response_with_image_search
from utils.whatsapp import send_message_whatsapp
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
    source_phone_number = get_integration_by_instance_name(instance_name).get("phone_number", None)
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
                    result = trigger_workflow_function(node["config"]["blocks"], company_schema, conversation_id, query, message_type)
                    if not result or len(result) == 0:
                        worflow_process_flag = False
                        break
                    messages = result
                    memory = await get_history(messages)
                if node["type"] == "condition":
                    print("Pass condition nodes Processing")
                    result = condition_workflow_function(node["config"]["blocks"], from_phone_number, source_phone_number, messages, query, message_type, platform)
                    if not result:
                        worflow_process_flag = False
                        break
                if node["type"] == "action":
                    print("Pass action nodes Processing")
                    workflow_response = await action_workflow_function(node["config"]["blocks"],company_id, company_schema, conversation_id, memory, from_phone_number, instance_name, query, message_type, platform, workflow["id"], [])
                    if workflow_response:
                        active_workflows_response.extend(workflow_response)
                if node["type"] == "delay":
                    print("Pass delay nodes Processing")
                    result = delay_workflow_function(node["config"]["blocks"])
            if not worflow_process_flag:
                except_case.append(workflow["except_case"])
    else:
        except_case.append("sample")
    except_case = list(set(except_case))
    except_response = []
    for i in except_case:
        if i == "sample":
            messages = get_all_messages(company_schema, conversation_id)
            memory = await get_history(messages)
            
            final_response, extra_info = await ai_response_with_search(company_id, company_schema, conversation_id, query, memory)
            if platform == "WhatsApp":
                sending_result = await send_message_whatsapp(instance_name, from_phone_number, final_response, extra_info)
                if not sending_result.get("success", False):
                    break
            
            # Insert new message into database        
            add_response = add_new_message(
                company_id=company_schema, 
                conversation_id=conversation_id, 
                sender_email="",
                sender_type="bot", 
                content=final_response,
                extra=json.dumps(extra_info)
            )
            
            if add_response:
                except_response.append(add_response[0])
        elif i == "move":
            pass
        elif i == "ignore":
            pass
    emissions_kg = tracker.stop()
    energy_kwh = tracker.final_emissions_data.energy_consumed
    update_message_energy(company_schema, conversation_id, energy_kwh, emissions_kg)
    active_workflows_response.extend(except_response)
    return active_workflows_response

async def generate_response_with_image_search(
    company_id: str, company_schema: str, conversation_id: str, query: str, from_phone_number: str, instance_name: str, message_type:str, platform:str, sample_image: io.BytesIO
):
    tracker.start()
    matches = search_similar_images(query_image_bytes=sample_image, index_name=f'{company_id}-image')
    source_phone_number = get_integration_by_instance_name(instance_name).get("phone_number", None)
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
                    result = condition_workflow_function(node["config"]["blocks"], from_phone_number, source_phone_number, messages, query, message_type, platform)
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
            if platform == "WhatsApp":
                sending_result = await send_message_whatsapp(instance_name, from_phone_number, final_response, extra_info)
                if not sending_result.get("success", False):
                    break
            
            # Insert new message into database        
            add_response = add_new_message(
                company_id=company_schema, 
                conversation_id=conversation_id, 
                sender_email="",
                sender_type="bot", 
                content=final_response,
                extra=json.dumps(extra_info)
            )
            
            if add_response:
                except_response.append(add_response[0])
        elif i == "move":
            pass
        elif i == "ignore":
            pass
    emissions_kg = tracker.stop()
    energy_kwh = tracker.final_emissions_data.energy_consumed
    update_message_energy(company_schema, conversation_id, energy_kwh, emissions_kg)
    active_workflows_response.extend(except_response)
    return except_response