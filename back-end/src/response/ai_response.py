from typing import List, Dict
from langchain_openai import ChatOpenAI
from langchain_core.tools import StructuredTool
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableSequence, RunnableMap
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain.agents import create_agent
from pydantic import BaseModel, Field

from src.utils.chroma_utils import search_vectors_product, search_vectors
from db.company_table import get_linked_images_from_table, get_linked_extra_from_table
from db.public_table import get_chatbot_personality
import os, json
import asyncio
from concurrent.futures import ThreadPoolExecutor
from src.action.actions import make_search_tool, get_customer_info_tool

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
llm_bot = ChatOpenAI(
    model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    api_key=OPENAI_KEY,
)

extra_info_conversations = {}

async def get_linked_info(retrieval_results: list[dict], company_schema: str, conversation_id: str):
    global extra_info_conversations
    extra_info = {"images": [], "extra": []}
    seen = set()

    for r in retrieval_results:
        pc_text = r["metadata"]["pc_text"]
        if pc_text in seen:
            continue
        seen.add(pc_text)
        primary_col = r["metadata"]["pc_primary_column"]

        image_linked = get_linked_images_from_table(
            company_id=company_schema,
            product_id=r["metadata"][primary_col],
        )
        document_linked = get_linked_extra_from_table(
            company_id=company_schema,
            product_id=r["metadata"][primary_col],
        )
        try:
            if image_linked:
                extra_info["images"].append(image_linked[0]["full_path"])
            if document_linked:
                extra_info["extra"].append(document_linked[0]["full_path"])
        except Exception:
            pass

    extra_info["images"] = list(set(extra_info["images"]))
    extra_info_conversations[conversation_id] = extra_info

def search_vectors_with_query(query: str, company_id: str, conversation_id: str, company_schema: str):
    results, differentiating_features = search_vectors_product(
        index_name=company_id,
        query_text=query,
        company_id=company_id,
        company_schema=company_schema,
        conversationId=conversation_id,
        top_k=5
    )
    
    if differentiating_features and len(differentiating_features) > 3:
        extra_info_conversations[conversation_id] = {}
        return f"Need more details. Please clarify: {differentiating_features}"

    retrieval_results = [r["metadata"]["pc_text"] for r in results]

    # Async image linking
    def run_async():
        new_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(new_loop)
        try:
            new_loop.run_until_complete(get_linked_info(results, company_schema, conversation_id))
        finally:
            new_loop.close()

    with ThreadPoolExecutor(max_workers=1) as executor:
        executor.submit(run_async).result()

    return list(set(retrieval_results))

class RetrievalQueryInput(BaseModel):
    query: str = Field(
        ...,
        description="""The full text query or key points describing the user's product need in feature and value. For example: "'Size': 1.5 | 'Conductor': Copper | 'Sub Category': Unarmoured Power Cables | 'Insulation': PVC | 'Standard': KS".""",
    )

def make_system_prompt(company_id: str):
    chatbot_personality = get_chatbot_personality(company_id)
    if not chatbot_personality:
        return "You are an AI sales assistant helping customers. Generate short, natural, clear sales replies."
    
    system_prompt = ""
    if chatbot_personality['bot_prompt']:
        system_prompt = system_prompt + chatbot_personality['bot_prompt']
    if chatbot_personality['bot_name']:
        system_prompt = system_prompt + f"\n Your name is {chatbot_personality['bot_name']}"
    if chatbot_personality["length_of_response"]:
        system_prompt = system_prompt + f"\n Your response should be {chatbot_personality['length_of_response']}"
    if chatbot_personality["chatbot_tone"]:
        system_prompt = system_prompt + f"\n Your tone should be {chatbot_personality['chatbot_tone']}"
    if chatbot_personality["prefered_lang"] != "None":
        system_prompt = system_prompt + f"\n Your prefered language is {chatbot_personality['prefered_lang']}"
        
    if chatbot_personality["use_emojis"]:
        system_prompt = system_prompt + "\n You can use emojis in your response"
    else:
        system_prompt = system_prompt + "\n You should not use emojis in your response"
    if chatbot_personality["use_bullet_points"]:
        system_prompt = system_prompt + "\n You can use bullet points in your response"
    else:
        system_prompt = system_prompt + "\n You should not use bullet points in your response"
    
    return system_prompt

async def ai_response_with_search(
    company_id: str, company_schema: str, conversation_id: str, query: str, memory: InMemoryChatMessageHistory, acions: list[str]
):
    extra_info_conversations[conversation_id] = {"images": [], "extra": []}
    # Make system prompt with chatbot personality
    system_prompt = make_system_prompt(company_id)
    tools = []
    # Make search tool
    for i in acions:
        if i == "Find on product's table":
            search_tool = make_search_tool(company_id, conversation_id, company_schema)
            tools.append(search_tool)
        if i == "Get customer information":
            extra_prompt, customer_tool = get_customer_info_tool(conversation_id, company_schema)
            if customer_tool:
                tools.append(customer_tool)
            system_prompt = system_prompt + "\n" + extra_prompt
    print("System prompt: ", system_prompt)
    # Create a tool-calling agent (function-calling mode)
    agent = create_agent(model=llm_bot, tools=tools, system_prompt=system_prompt)

    with_history = RunnableWithMessageHistory(
        agent,
        lambda session_id: memory,
        input_messages_key="messages",
        history_messages_key="messages",
    )

    result = with_history.invoke({"messages": query}, config={"configurable": {"session_id": conversation_id}})
    return result["messages"][-1].content, extra_info_conversations.get(conversation_id, {})

async def ai_response_with_image_search(
    company_id: str, company_schema: str, conversation_id: str, query: str, memory: InMemoryChatMessageHistory, image_search_result: list[dict]
):
    # Make system prompt with chatbot personality
    system_prompt = make_system_prompt(company_id)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder("history"),
        ("human", "{input}")
    ])
    
    images_info = []
    extra_info = {"images": [], "extra": []}
    
    for image in image_search_result:
        file_name = image["metadata"]["pc_file_name"].split("/")[-1]
        file_extension = image["metadata"]["pc_file_extension"]
        file_id = file_name.replace(file_extension, "")
        match_field = image["metadata"]["match_field"]

        items = search_vectors(
            index_name=company_id,
            company_id=company_id,
            extra_filter={match_field: file_id}
        )
        
        for i in items['data']:
            extra_info["images"].append(image["metadata"]["full_path"])
            extra_documents = get_linked_extra_from_table(company_schema, file_id)
            if extra_documents:
                extra_info["extra"].append(extra_documents[0]["full_path"])
            images_info.append(i["metadata"]["pc_text"])
            
    chain = RunnableSequence(
            {"input": lambda x: x["query"], "history": lambda x: x["history"]},
            prompt | llm_bot,
        )
    
    with_history = RunnableWithMessageHistory(
        chain,
        lambda session_id: memory,
        input_messages_key="query",
        history_messages_key="history",
    )

    result = with_history.invoke(
        {"query": f"{query}\n\nSimilar Products Info: {images_info}"},
        config={"configurable": {"session_id": conversation_id}},
    )
    return result.content, extra_info

async def combine_all_response_into_one(company_id: str, conversation_id:str, memory: InMemoryChatMessageHistory, all_responses: list):
    print("Stop working for final response")
    system_prompt = make_system_prompt(company_id)

    final_prompt = f"""
Combine all response messages into one well-written, unified reply.

Role:
{system_prompt}

Task:
- Read the list of response messages.
- Merge them into one clear, natural, and coherent response.
- Output only the final combined response.
"""
    prompt = ChatPromptTemplate.from_messages([
        ("system", final_prompt),
        MessagesPlaceholder("history"),
        ("human", "{input}")
    ])
    chain = RunnableSequence(
            {"input": lambda x: x["query"], "history": lambda x: x["history"]},
            prompt | llm_bot,
        )
    
    with_history = RunnableWithMessageHistory(
        chain,
        lambda session_id: memory,
        input_messages_key="query",
        history_messages_key="history",
    )

    result = with_history.invoke(
        {"query": f"\nResponses: {all_responses}"},
        config={"configurable": {"session_id": conversation_id}},
    )
    print(result.content)
    return result.content,
