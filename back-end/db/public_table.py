from db.db_connection import db
from db.company_table import create_company_tables
import time

# Companies
def get_companies(key:str, value):
    query = f"SELECT * FROM public.companies WHERE {key} = %s"
    result = db.execute_query(query, (value,))
    if result:
        return dict(result[0])
    else:
        return None

def create_companies(name:str, description:str):
    # Create a unique schema name for the company
    company_schema_name = f"company_{str(time.time()).replace('.', '')}"
    try:
        # Insert company data
        query = """
            INSERT INTO public.companies (name, description, schema_name, active)
            VALUES (%s, %s, %s, %s)
            RETURNING *
        """
        result = db.execute_insert(query, (name, description, company_schema_name, True))
        result = dict(result)
        if result:
            # Create company schema and table
            add_chatbot_personality(result['id'], "You are a helpful assistant")
            create_company_tables(company_schema_name)
            return result
        else:
            return None
    except Exception as e:
        print(f"Error creating company: {e}")
        return None

def update_company_by_id(id:str, data:dict):
    try:
        # Build dynamic UPDATE query
        set_clause = ", ".join([f"{key} = %s" for key in data.keys()])
        values = list(data.values()) + [id]
        query = f"UPDATE public.companies SET {set_clause} WHERE id = %s RETURNING *"
        result = db.execute_update(query, values)
        if result:
            return dict(result)
        else:
            return None
    except Exception as e:
        print(f"Error updating company: {e}")
        return None

# Roles
def get_roles(key:str=None, value=None):
    if key:
        query = f"SELECT * FROM public.roles WHERE {key} = %s"
        result = db.execute_query(query, (value,))
        if result:
            return dict(result[0])
    else:
        query = "SELECT * FROM public.roles"
        result = db.execute_query(query)
        if result:
            return [dict(row) for row in result]
    return None

# Users
def get_user_with_permission(key:str, value):
    query = f"SELECT * FROM public.users_with_permissions WHERE {key} = %s"
    result = db.execute_query(query, (value,))
    if result:
        return dict(result[0])
    else:
        return None

def get_users(key:str, value):
    query = f"SELECT * FROM public.users WHERE {key} = %s"
    result = db.execute_query(query, (value,))
    if result:
        return dict(result[0])
    else:
        return None

def add_new_user(name:str, email:str, password:str, company_id:str, role:str, invited_by:str = ""):
    print({"name": name, "email": email, "password": password, "company_id": company_id, "role": role})
    try:
        if invited_by:
            query = """
                INSERT INTO public.users (name, email, password, company_id, role, invited_by)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
            """
            result = db.execute_insert(query, (name, email, password, company_id, role, invited_by))
        else:
            query = """
                INSERT INTO public.users (name, email, password, company_id, role)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *
            """
            result = db.execute_insert(query, (name, email, password, company_id, role))

        if result:
            return dict(result)
        else:
            return None
    except Exception as e:
        print(f"Error adding user: {e}")
        return None

def update_user_by_id(id:str, data:dict):
    try:
        # Build dynamic UPDATE query
        set_clause = ", ".join([f"{key} = %s" for key in data.keys()])
        values = list(data.values()) + [id]
        query = f"UPDATE public.users SET {set_clause} WHERE id = %s RETURNING *"
        result = db.execute_update(query, values)
        if result:
            return dict(result)
        else:
            return None
    except Exception as e:
        print(f"Error updating user: {e}")
        return None

# Invitation
def get_invitations_with_users(key:str, value):
    query = f"SELECT * FROM public.invitation_with_users WHERE {key} = %s"
    result = db.execute_query(query, (value,))
    if result:
        return [dict(row) for row in result]
    else:
        return None

def get_invitations(key:str, value):
    query = f"SELECT * FROM public.invitations WHERE {key} = %s"
    result = db.execute_query(query, (value,))
    if result:
        return [dict(row) for row in result]
    else:
        return None

def add_invitation(email:str, company_id:str, role:str, token_hash:str, invited_by:str):
    # Insert invitation into DB
    try:
        query = """
            INSERT INTO public.invitations (company_id, invited_email, invited_by, role, status, token_hash)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
        """
        result = db.execute_insert(query, (company_id, email, invited_by, role, "pending", token_hash))
        if result:
            return dict(result)
        else:
            return None
    except Exception as e:
        print(f"Error adding invitation: {e}")
        return None

def update_invitation_by_id(id:str, data:dict):
    try:
        # Build dynamic UPDATE query
        set_clause = ", ".join([f"{key} = %s" for key in data.keys()])
        values = list(data.values()) + [id]
        query = f"UPDATE public.invitations SET {set_clause} WHERE id = %s RETURNING *"
        result = db.execute_update(query, values)
        if result:
            return dict(result)
        else:
            return None
    except Exception as e:
        print(f"Error updating invitation: {e}")
        return None

# Integration

def get_integrations(data:dict):
    # Build WHERE clause dynamically
    where_clauses = [f"{key} = %s" for key in data.keys()]
    where_clause = " AND ".join(where_clauses)
    values = list(data.values())

    query = f"SELECT * FROM public.integrations_with_users WHERE {where_clause} ORDER BY id"
    result = db.execute_query(query, values)
    if result:
        return [dict(row) for row in result]
    else:
        return None

def add_new_integration(company_id, type, phone_number, instance_name, created_by):
    try:
        query = """
            INSERT INTO public.integrations (company_id, type, phone_number, instance_name, created_by)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *
        """
        result = db.execute_insert(query, (company_id, type, phone_number, instance_name, created_by))
        if result:
            return dict(result)
        else:
            return None
    except Exception as e:
        print(f"Error adding integration: {e}")
        return None

def update_integration_by_id(id:str, data:dict):
    try:
        # Build dynamic UPDATE query
        set_clause = ", ".join([f"{key} = %s" for key in data.keys()])
        values = list(data.values()) + [id]
        query = f"UPDATE public.integrations SET {set_clause} WHERE id = %s RETURNING *"
        result = db.execute_update(query, values)
        if result:
            return dict(result)
        else:
            return None
    except Exception as e:
        print(f"Error updating integration: {e}")
        return None

def add_chatbot_personality(company_id, bot_prompt):
    try:
        query = """
            INSERT INTO public.bot_personality (company_id, bot_prompt, length_of_response, chatbot_tone, prefered_lang)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *
        """
        result = db.execute_insert(query, (company_id, bot_prompt, 'Medium', 'Neutral', 'None'))
        if result:
            return dict(result)
        else:
            return None
    except Exception as e:
        print(f"Error adding chatbot personality: {e}")
        return None

def update_chatbot_personality_by_id(comany_id:str, data:dict):
    try:
        # Build dynamic UPDATE query
        set_clause = ", ".join([f"{key} = %s" for key in data.keys()])
        values = list(data.values()) + [comany_id]
        query = f"UPDATE public.bot_personality SET {set_clause} WHERE company_id = %s RETURNING *"
        result = db.execute_update(query, values)
        if result:
            return dict(result)
        else:
            return None
    except Exception as e:
        print(f"Error updating chatbot personality: {e}")
        return None

def get_chatbot_personality(company_id:str):
    query = "SELECT * FROM public.bot_personality WHERE company_id = %s"
    result = db.execute_query(query, (company_id,))
    if result:
        return dict(result[0])
    else:
        return None