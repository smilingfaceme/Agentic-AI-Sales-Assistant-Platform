from typing import List, Dict
from src.utils.pinecone_utills import search_vectors_product
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
    query: str = Field(..., description="""The full text query or key points describing the user's product need in feature and value. 
                       For example: "'Size': 1.5 | 'Conductor': Copper | 'Sub Category': Unarmoured Power Cables | 'Insulation': PVC | 'Standard': KS".""")
    require_new_products: bool = Field(..., description="""Indicates whether the user wants a new and different set of products.
• True: User disliked or rejected previous results; return new items not shown before.
• False: User wants to refine, filter, or continue from previous product options.""")
    
def safe_string(value: str) -> str:
    """
    Escape a string for safe use in SQL queries by doubling single quotes.
    """
    if not isinstance(value, str):
        value = str(value)
    
    # Escape backslashes and quotes
    safe_value = value.replace("'", "''")
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

def generate_response(user_message:str, chat_memory:ConversationSummaryBufferMemory, company_id:str, conversation_id:str):
    prompt_Tempalte = f"""You are an AI sales assistant helping customers. Generate a helpful, persuasive, and natural sales response. The response must be clear and short like human response."""
    prompt = ChatPromptTemplate.from_messages([
        ("system", prompt_Tempalte),
        MessagesPlaceholder("history"),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])
    
    def search_vectors_with_query(query: str, require_new_products:bool) -> List[Dict]:
        results, differentiating_features = search_vectors_product(index_name=company_id, query_text=query, company_id=company_id, conversationId=conversation_id,  new_search=require_new_products, top_k=5)
        if differentiating_features:
            return f"User query is not enough to search products. Ask user with following options: {differentiating_features}"
        else:
            retrieval_results = [r['metadata']['pc_text'] for r in results]
        return retrieval_results
    
    # Tool Calling Functions
    db_tool = StructuredTool.from_function(
        func=search_vectors_with_query,
        name="search_vectors_with_query",
        description="""Search the vector database to find the most relevant products based on the user’s natural language query or product requirements.
        The input query should include as many specific product details as possible to improve search accuracy and relevance.""",
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
    
    response = generate_response(query, chat_memory, company_id, conversation_id)
    return safe_string(response)