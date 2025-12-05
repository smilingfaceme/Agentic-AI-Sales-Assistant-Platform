from fastapi import APIRouter, HTTPException, Depends, Query, Body
from middleware.auth import verify_token
from db.public_table import get_companies
from db.company_table import (
    add_new_customer,
    get_all_customers,
    get_customer_by_id,
    update_customer,
    update_conversation_by_id
)

# Initialize FastAPI router for customer-related routes
router = APIRouter()

# ---------------------------
# ROUTES
# ---------------------------

@router.post("/new")
async def create_customer(data = Body(...), user = Depends(verify_token)):
    """
    Create a new customer for the company.
    
    Args:
        data (dict): Request body containing customer details:
            - customer_name (str, required): Customer's name
            - customer_email (str, optional): Customer's email
            - customer_phone (str, optional): Customer's phone number
            - conversation_id (str, optional): Associated conversation ID
            - agent_id (str, optional): Assigned agent ID
        user (dict): Authenticated user data, injected via dependency.
    
    Returns:
        dict: Success message and created customer data.
    """
    customer_name = data.get("customer_name")
    customer_email = data.get("customer_email")
    customer_phone = data.get("customer_phone")
    conversation_id = data.get("conversation_id")
    customer_id = data.get("customer_id")
    agent_id =  data.get("agent_id") if data.get("agent_id") else None
    
    # Validate required fields
    if not customer_name:
        raise HTTPException(status_code=400, detail="customer_name is required")
    company_info = get_companies("id", user['company_id'])
    company_schema = company_info["schema_name"]
    # Create new customer
    if not customer_id:
        new_customer = add_new_customer(
            company_id=company_schema,
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone
        )
        if not new_customer:
            raise HTTPException(status_code=500, detail="Failed to create customer")
        customer_id = new_customer[0]['customer_id']
    
    conversation = update_conversation_by_id(company_schema, conversation_id, {"customer_id": customer_id, 'agent_id': agent_id})
    if not conversation:
        raise HTTPException(status_code=500, detail="Failed to update conversation")
    return {
        "message": "Customer created successfully",
        "customer": new_customer[0]
    }


@router.get("/all")
async def get_customers(user = Depends(verify_token)):
    """
    Retrieve all customers for the authenticated user's company.
    
    Args:
        user (dict): Authenticated user data, injected via dependency.
    
    Returns:
        dict: List of all customers.
    """
    company_info = get_companies("id", user['company_id'])
    company_schema = company_info["schema_name"]
    customers = get_all_customers(company_schema)
    result = {}
    for i in customers:
        if i.get("customer_id", ""):
            if i['customer_id'] not in result:
                result[i['customer_id']] = [i]
            else:
                result[i['customer_id']].append(i)
    final_result = []
    for i in result.keys():
        # customer = sorted(result[i], key=lambda x: x['created_at'], reverse=True)
        final_info = {
            "customer_id": i,
            "customer_name": result[i][0]['customer_name'],
            "customer_email": result[i][0]['customer_email'],
            "customer_phone": result[i][0]['customer_phone'],
            "conversations": [{
                "conversation_id": c['conversation_id'],
                "conversation_name": c['conversation_name'],
                "source": c['source'],
                "phone_number": c['phone_number'],
                "instance_name": c['instance_name'],
                "ai_reply": c['ai_reply'],
                "created_at": c['created_at'],
                "agent_id": c['agent_id'],
                "agent_name": c['name'],
                "agent_email": c['email']
            } for c in result[i]]
        }
        final_result.append(final_info)
    print(final_result)
    return {
        "message": "Customers retrieved successfully",
        "customers": final_result
    }


@router.put("/update/{customer_id}")
async def update_customer_info(
    customer_id: str,
    data = Body(...),
    user = Depends(verify_token)
):
    """
    Update customer information.

    Args:
        customer_id (str): The customer's unique identifier.
        data (dict): Request body containing fields to update:
            - customer_name (str, optional): Customer's name
            - customer_email (str, optional): Customer's email
            - customer_phone (str, optional): Customer's phone number
            - conversation_id (str, optional): Associated conversation ID
            - agent_id (str, optional): Assigned agent ID
        user (dict): Authenticated user data, injected via dependency.

    Returns:
        dict: Success message and updated customer data.
    """
    customer_name = data.get("customer_name")
    customer_email = data.get("customer_email")
    customer_phone = data.get("customer_phone") if data.get("customer_phone") else None
    conversation_id = data.get("conversation_id") if data.get("conversation_id") else None
    agent_id =  data.get("agent_id") if data.get("agent_id") else None
    
    company_info = get_companies("id", user['company_id'])
    company_schema = company_info["schema_name"]
    # Update customer
    updated_customer = update_customer(
        company_id=company_schema,
        customer_id=customer_id,
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
    )

    if not updated_customer:
        raise HTTPException(status_code=404, detail="Customer not found or failed to update")

    conversation = update_conversation_by_id(company_schema, conversation_id, {"customer_id": customer_id, 'agent_id': agent_id})
    if not conversation:
        raise HTTPException(status_code=500, detail="Failed to update conversation")
    return {
        "message": "Customer updated successfully",
        "customer": updated_customer[0]
    }


@router.get("/get/{conversationId}")
async def get_customer_info(conversationId: str, user = Depends(verify_token)):
    """
    Retrieve customer information.

    Args:
        customer_id (str): The customer's unique identifier.
        user (dict): Authenticated user data, injected via dependency.

    Returns:
        dict: Customer data.
    """
    company_info = get_companies("id", user['company_id'])
    company_schema = company_info["schema_name"]
    customers = get_customer_by_id(company_schema, conversationId)
    
    return {
        "message": "Customers retrieved successfully",
        "customers": customers
    }