from typing import List, Dict
from src.utils.pinecone_utills import search_vectors_product, search_vectors
from db.company_table import get_all_messages

from langchain_openai import ChatOpenAI
from langchain.memory import ConversationSummaryBufferMemory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains.llm import LLMChain
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

def generate_response_with_image(
    image_search: list[dict],
    chat_memory,
    company_id: str,
    conversation_id: str,
    query:str
):
    prompt_template = """You are an AI sales assistant helping customers.
Generate a helpful, persuasive, and natural sales response.
The response must be clear and short like a human response."""

    prompt = ChatPromptTemplate.from_messages([
        ("system", prompt_template),
        MessagesPlaceholder("history"),
        ("human", "{input}")
    ])

    images_info = []
    for image in image_search:
        file_name = image['metadata']['pc_file_name'].split('/')[-1]
        file_extension = image['metadata']['pc_file_extension']
        file_id = file_name.replace(file_extension, '')
        match_field = image['metadata']['match_field'].upper()
        # Search vectors (assuming this is defined elsewhere)
        items = search_vectors(
            index_name=company_id,
            company_id=company_id,
            extra_filter={match_field: file_id}
        )
        print([i["metadata"][match_field] for i in items])
        images_info.append([i["metadata"]['pc_text'] for i in items])

    print(images_info)

    # ✅ Tell memory what the input/output keys are
    chat_memory.input_key = "input"
    chat_memory.output_key = "output"

    # ✅ LLMChain now matches the memory keys
    chain = LLMChain(
        llm=llm_bot,
        prompt=prompt,
        memory=chat_memory,
        verbose=True,
        output_key="output"
    )
    input_content = f'{query} \n\n Similar Products Info: {images_info}'
    # Run the chain
    result = chain.invoke({"input": input_content})
    return result["output"]

async def generate_response_with_image_search(company_id:str, company_schema:str, conversation_id:str, query: str, image_search:list[dict]):
    chat_memory = await get_histroy(company_schema, conversation_id)
    
    response = generate_response_with_image(image_search, chat_memory, company_id, conversation_id, query)
    return safe_string(response)