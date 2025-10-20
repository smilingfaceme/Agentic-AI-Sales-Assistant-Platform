# Import required modules from FastAPI, Pydantic, utilities, and external libraries
from fastapi import APIRouter, HTTPException, status, Body

from db.public_table import *
from utils.token_handler import hash_password, create_access_token, verify_password

# Initialize API router
router = APIRouter()

# -------------------------------
# Routes
# -------------------------------
@router.post("/register")
async def register(
    name: str = Body(...),
    email: str = Body(...),
    password: str = Body(...),
    company: str = Body(...),
    description: str = Body(...)
):
    """
    Register a new user along with their company.
    
    - Checks if the user already exists.
    - Creates a new company record.
    - Creates a user with the 'admin' role.
    - Returns a JWT token and user information.
    """
    # Validate required fields
    if not name or not email or not password or not company:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # Check if user already exists
    existing_user = get_users("email", email)
    if existing_user:
        now_user = get_user_with_permission("email", email)
        if not now_user:
            raise HTTPException(
                status_code=400, 
                detail="You’ve previously registered with this email, but your account has been deleted. "
                       "If you’d like to recover your account, please contact our support team."
            )
        else:
            raise HTTPException(status_code=400, detail="User already exists")
    
    # Insert new company data and create company schema and table
    new_company = await create_companies(name=company, description=description)
    if not new_company:
        raise HTTPException(status_code=400, detail="Registration failed")
    
    # Fetch admin role
    role_info = get_roles('name','admin')
    if not role_info:
        raise HTTPException(status_code=400, detail="Role not found")
    
    # Hash password and create user
    hashed_password = hash_password(password)
    new_user = add_new_user(name=name, email=email, password=hashed_password, company_id=new_company['id'], role=role_info['id'])
    
    if not new_user:
        raise HTTPException(status_code=400, detail="Registration failed")
    
    # Create JWT token with user info
    token_data = {
        "id": new_user["id"],
        "email": new_user["email"],
        "role": role_info['name'],
        "company_id": new_company['id'],
        "permissions": role_info['permissions']
    }
    
    token = create_access_token(token_data)
    
    return {
        "message": "User registered successfully",
        "token": token,
        "user": {
            "name": new_user["name"], 
            "email": new_user["email"], 
            "company_name": new_company['name'],
            "company_description": new_company['description'],
            "role": role_info['name'],
            "permissions": role_info['permissions']
        }
    }

@router.post("/login")
async def login(
    email: str = Body(...),
    password: str = Body(...)
):
    """
    Authenticate a user with email and password.
    
    - Validates the user exists and is active.
    - Verifies the password.
    - Returns a JWT token and user information.
    """
    # Validate required fields
    if not email or not password:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    user = get_user_with_permission("email", email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found. Please register before logging in.")
    
    # Check if user is active
    if user['active'] == False:
        raise HTTPException(
            status_code=401, 
            detail="The Company Account has not been activated. "
                    "Please contact the administrator of the company to activate your account or your company."
        )
    
    if not verify_password(password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    
    # Create JWT token with user info
    token_data = {
        "id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role_name"],
        "company_id": user["company_id"],
        "permissions": user['permissions']
    }
    token = create_access_token(token_data)
    
    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "name": user["name"], 
            "email": user["email"],
            "company_name": user['company_name'],
            "company_description": user["company_description"],
            "role": user['role_name'],
            "permissions": user['permissions']
        }
    }