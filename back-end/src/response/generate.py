from typing import List, Dict
from src.utils.pinecone_utills import search_vectors
from src.service_client import openai_service
from db.company_table import get_all_messages

from langchain_openai import ChatOpenAI
from langchain.memory import ConversationSummaryBufferMemory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents import AgentExecutor
from langchain.agents import create_openai_functions_agent
from langchain.tools import StructuredTool
from pydantic import BaseModel, Field
import os

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
# Setting LLM
llm_bot = ChatOpenAI( model=os.getenv('OPENAI_MODEL', 'gpt-4o-mini'), api_key=OPENAI_KEY)

class RetrievalQueryInput(BaseModel):
    query: str = Field(..., description="The full text query or key points describing the user's product need. For example: 'affordable 4K smart TV with HDMI support' or 'wireless noise-cancelling headphones under $200'.")

def safe_string(value: str) -> str:
    """
    Safely format a string by escaping problematic characters
    (like backslashes, quotes, and newlines) for SQL or JSON contexts.
    """
    if not isinstance(value, str):
        value = str(value)
    
    # Escape backslashes and quotes
    safe_value = (
        value.replace("'", "\'")
             .replace('"', '\"')
             .replace("\n", "\n")
             .replace("\r", "\r")
    )
    return safe_value


async def get_histroy(company_schema: str, conversation_id: str):
    memory = ConversationSummaryBufferMemory(
        llm=llm_bot,
        max_token_limit=1200,
        memory_key="history",
        return_messages=True,
        output_key="output",
    )
    print("pass here! - Getting history", company_schema, conversation_id)
    
    messages = await get_all_messages(company_schema, conversation_id)
    if messages["status"] == "success":
        messages = messages['rows']
        messages = sorted(messages, key=lambda k: k['created_at'], reverse=False)
        for m in messages:
            print(m["content"])
            if m['sender_type'] == 'customer':
                memory.chat_memory.add_user_message(m["content"])
            else:
                memory.chat_memory.add_ai_message(m["content"])
        return memory
    else:
        return memory

def generate_response(user_message:str, chat_memory:ConversationSummaryBufferMemory, company_id:str):
    prompt_Tempalte = f"""You are an AI sales assistant helping customers. Generate a helpful, persuasive, and natural sales response. The response must be clear and short like human response."""
    prompt = ChatPromptTemplate.from_messages([
        ("system", prompt_Tempalte),
        MessagesPlaceholder("history"),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])
    
    def search_vectors_with_query(query: str) -> List[Dict]:
        results = search_vectors(index_name=company_id, query_text=query, company_id=company_id, top_k=5)
        retrieval_results = [r['metadata']['text'] for r in results]
        return retrieval_results
    
    # Tool Calling Functions
    db_tool = StructuredTool.from_function(
        func=search_vectors_with_query,
        name="search_vectors_with_query",
        description="Search for the most relevant products in the vector database based on a user's natural language query or main product requirement.",
        args_schema=RetrievalQueryInput,
    )
    tools = [db_tool]
    
    agent = create_openai_functions_agent(
        llm=llm_bot,
        tools=tools,
        prompt=prompt
    )
    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        memory=chat_memory,     # <- keeps summary memory working across turns
        verbose=True
    )
    
    # Generate response
    final_output = None
    for chunk in agent_executor.stream({"input": user_message}):
        if "output" in chunk:
            # stream token chunks
            final_output = chunk["output"]
        
    return final_output

  
async def generate_response_with_search(company_id:str, company_schema:str, conversation_id:str, query: str, top_k: int = 5):
    chat_memory = await get_histroy(company_schema, conversation_id)
    
    response = generate_response(query, chat_memory, company_id)
    return safe_string(response)