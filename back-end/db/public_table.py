from db.supabase_client import supabase
from db.company_table import create_company_tables
import time

# Companies
def get_companies(key:str, value):
    response_company = supabase.table('companies').select('*').eq(key, value).execute()
    if response_company.data:
        return response_company.data[0]
    else:
        return None

def create_companies(name:str, description:str):
    # Create a unique schema name for the company
    company_schema_name = f"company_{str(time.time()).replace('.', '')}"
    companies_data = {
        'name': name,
        'description': description,
        'schema_name': company_schema_name
    }
    try:
        # Insert company data
        response_company = supabase.table('companies').insert([companies_data]).execute()
        if response_company.data:
            # Create company schema and table
            create_company_tables(company_schema_name)
            return response_company.data[0]
        else:
            return None
    except:
        return None

def update_company_by_id(id:str, data:dict):
    try:
        response_company = supabase.table('companies').update([data]).eq('id', id).execute()
        if response_company.data:
            return response_company.data[0]
        else:
            return None
    except:
        return None

# Roles
def get_roles(key:str=None, value=None):
    if key:
        response_role = supabase.table('roles').select('*').eq(key, value).execute()
        if response_role.data:
            return response_role.data[0]
    else:
        response_role = supabase.table('roles').select('*').execute()
        if response_role.data:
            return response_role.data
    return None

# Users
def get_user_with_permission(key:str, value):
    response_users = supabase.table('users_with_permissions').select('*').eq(key, value).execute()
    if response_users.data:
        return response_users.data[0]
    else:
        return None
    
def get_users(key:str, value):
    response_users = supabase.table('users').select('*').eq(key, value).execute()
    if response_users.data:
        return response_users.data[0]
    else:
        return None

def add_new_user(name:str, email:str, password:str, company_id:str, role:str, invited_by:str = ""):
    data = {
        "name": name,
        "email": email,
        "password": password,
        "company_id": company_id,
        "role": role,
        "invited_by": invited_by
    }
    try:
        response_users = supabase.table('users').insert([data]).execute()
        if response_users.data:
            return response_users.data[0]
        else:
            return None
    except:
        return None

def update_user_by_id(id:str, data:dict):
    try:
        response_users = supabase.table('users').update([data]).eq('id', id).execute()
        if response_users.data:
            return response_users.data[0]
        else:
            return None
    except:
        return None

# Invitation
def get_invitations_with_users(key:str, value):
    response = supabase.table("invitation_with_users").select("*").eq(key, value).execute()
    if response.data:
        return response.data
    else:
        return None

def get_invitations(key:str, value):
    response = supabase.table("invitations").select("*").eq(key, value).execute()
    if response.data:
        return response.data
    else:
        return None

def add_invitation(email:str, company_id:str, role:str, token_hash:str, invited_by:str):
    # Insert invitation into DB
    new_invitation = {
        "company_id": company_id,
        "invited_email": email,
        "invited_by": invited_by,
        "role": role,
        "status": "pending",
        "token_hash": token_hash
    }
    try:
        response = supabase.table("invitations").insert([new_invitation]).execute()
        if response.data:
            return response.data[0]
        else:
            return None
    except:
        return None

def update_invitation_by_id(id:str, data:dict):
    try:
        response = supabase.table("invitations").update([data]).eq("id", id).execute()
        if response.data:
            return response.data[0]
        else:
            return None
    except:
        return None

# Integration

def get_integrations(data:dict):
    keys = data.keys()
    query = supabase.table("integrations_with_users").select("*")
    for i in keys:
        query.eq(i, data[i])
    response = query.order("id").execute()
    if response.data:
        return response.data
    else:
        return None

def add_new_integration(company_id, type, phone_number, instance_name, created_by):
    new_integration = {
        "company_id": company_id,
        "type": type,
        "phone_number": phone_number,
        "instance_name": instance_name,
        "created_by": created_by
    }
    try:
        response = supabase.table("integrations").insert([new_integration]).execute()
        if response.data:
            return response.data[0]
        else:
            return None
    except:
        return None

def update_integration_by_id(id:str, data:dict):
    try:
        response = supabase.table("integrations").update([data]).eq("id", id).execute()
        if response.data:
            return response.data[0]
        else:
            return None
    except:
        return None