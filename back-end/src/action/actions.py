from langchain_openai import ChatOpenAI
from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field

from src.utils.chroma_utils import search_vectors_product
from db.company_table import get_linked_images_from_table, update_customer_with_key, get_linked_extra_from_table, get_customer_by_id, add_new_customer, update_customer, update_conversation_by_id
import os
import asyncio
from concurrent.futures import ThreadPoolExecutor


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

def make_search_tool(company_id: str, conversation_id: str, company_schema: str):
    return StructuredTool(
        name="search_vectors_with_query",
        description="Search the vector database to find the most relevant products based on the user’s natural language query or product requirements. The input query should include as many specific product details as possible to improve search accuracy and relevance.",
        func=lambda query: search_vectors_with_query(
            query=query,
            company_id=company_id,
            conversation_id=conversation_id,
            company_schema=company_schema,
        ),
        args_schema=RetrievalQueryInput,
    )


def update_customer_info(company_schema: str, conversation_id: str, customer_id: str, customer_name: str, customer_email: str, customer_phone: str):
    print("Pass update customer info")
    print(customer_id, company_schema, customer_name, customer_email, customer_phone)
    if customer_id == "new":
        new_customer = add_new_customer(
            company_id=company_schema,
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone
        )
        
        if not new_customer:
            return False
        
        customer_id = new_customer[0]['customer_id']
        conversation = update_conversation_by_id(company_schema, conversation_id, {"customer_id": customer_id})
    else:
        update_customer_with_key(
            company_id=company_schema,
            customer_id=customer_id,
            data={
                "customer_name": customer_name,
                "customer_email": customer_email,
                "customer_phone": customer_phone
            }
        )
    return customer_id

class CustomerInfoInput(BaseModel):
    customer_name: str = Field(
        ...,
        description="Customer's full name, or empty string if not provided.",
    )
    customer_email: str = Field(
        ...,
        description="Customer's email address, or empty string if not provided.",
    )
    customer_phone: str = Field(
        ...,
        description="Customer's phone number, or empty string if not provided.",
    )

def get_customer_info_tool( conversation_id: str, company_schema: str):
    customers = get_customer_by_id(company_schema, conversation_id)
    print("pass customer filter", customers)

    # Case 1: Customer exists and already has all info → no update needed
    if (
        customers
        and customers[0]
        and customers[0]['customer_name']
        and customers[0]['customer_email']
        and customers[0]['customer_phone']
    ):
        return "", None

    # Case 2: Customer exists but missing info → update existing
    elif customers and customers[0]["customer_id"]:
        asking_prompt = "If information (name, email, or phone) is not provided, Ask for the missing information."
        def update_existing_customer(customer_name: str, customer_email: str, customer_phone: str):
            return update_customer_info(
                company_schema=company_schema,
                conversation_id=conversation_id,
                customer_id=customers[0]['customer_id'],
                customer_name=customer_name,
                customer_email=customer_email,
                customer_phone=customer_phone,
            )

        return asking_prompt, StructuredTool(
            name="update_customer_info",
            description=(
                "Extract customer information such as name, email, and phone number from the conversation. Any field not found must be returned as an empty string."
            ),
            func=update_existing_customer,
            args_schema=CustomerInfoInput,
        )

    # Case 3: Customer does not exist → create new
    else:
        def create_new_customer(customer_name: str | None, customer_email: str | None, customer_phone: str | None):
            return update_customer_info(
                company_schema=company_schema,
                conversation_id=conversation_id,
                customer_id="new",
                customer_name=customer_name,
                customer_email=customer_email,
                customer_phone=customer_phone,
            )

        return "---------------\n First of all, ask name, email, and phone number.", StructuredTool(
            name="update_customer_info",
            description=(
                "Store customer information such as name, email, and phone number from the conversation. Any field not found must be returned as an empty string."
                ),
            func=create_new_customer,
            args_schema=CustomerInfoInput,
        )
