from db.db_connection import db
from models.schema import *
import json

def create_company_tables(company_id: str):
    """Create schema and tables for a new company"""
    try:
        # Create schema
        schema_query = f"CREATE SCHEMA IF NOT EXISTS {company_id}"
        db.execute_raw(schema_query)

        # Create conversations table
        conversations_query = COMPANY_CONVERSATION_TABLE.format(company_id=company_id)
        db.execute_raw(conversations_query)

        # Create messages table
        messages_query = COMPANY_MESSAGE_TABLE.format(company_id=company_id)
        db.execute_raw(messages_query)

        # Create images table
        images_query = COMPANY_IMAGE_TABLE.format(company_id=company_id)
        db.execute_raw(images_query)
        
        # Create images table
        extra_query = COMPANY_EXTRA_TABLE.format(company_id=company_id)
        db.execute_raw(extra_query)
        
        # Create KNOWLEDGE table
        knowledge_query = COMPANY_KNOWLEDGE_TABLE.format(company_id=company_id)
        db.execute_raw(knowledge_query)

        return {"status": "success", "message": "Company tables created"}
    except Exception as e:
        print(f"Error creating company tables: {e}")
        return {"status": "error", "message": str(e)}

def add_new_conversation(company_id: str, conversation_name: str, source: str, phone_number: str, instance_name:str=""):
    """Add a new conversation"""
    try:
        query = f"""
            INSERT INTO {company_id}.conversations (conversation_name, source, phone_number, instance_name)
            VALUES (%s, %s, %s, %s)
            RETURNING *
        """
        result = db.execute_insert(query, (conversation_name, source, phone_number, instance_name))
        if result:
            return [dict(result)]
        return []
    except Exception as e:
        print(f"Error adding conversation: {e}")
        return []

def toggle_ai_reply_for_conversation(company_id: str, conversation_id: str):
    """Toggle AI reply for a conversation"""
    try:
        query = f"""
            UPDATE {company_id}.conversations
            SET ai_reply = NOT ai_reply
            WHERE conversation_id = %s
            RETURNING *
        """
        result = db.execute_update(query, (conversation_id,))
        if result:
            return [dict(result)]
        return []
    except Exception as e:
        print(f"Error toggling AI reply: {e}")
        return []

def get_all_conversations(company_id: str):
    """Get all conversations for a company"""
    try:
        query = f"SELECT * FROM {company_id}.conversations"
        result = db.execute_query(query)
        if result:
            return [dict(row) for row in result]
        return []
    except Exception as e:
        print(f"Error getting conversations: {e}")
        return []

def get_conversation_by_id(company_id: str, conversation_id: str):
    """Get a specific conversation by ID"""
    try:
        query = f"SELECT * FROM {company_id}.conversations WHERE conversation_id = %s"
        result = db.execute_query(query, (conversation_id,))
        if result:
            return [dict(result[0])]
        return []
    except Exception as e:
        print(f"Error getting conversation: {e}")
        return []

def get_conversatin_by_phone_integration(company_id: str, phone_number: str, instance_name:str):
    """Get conversation by phone integration"""
    try:
        query = f"""
            SELECT * FROM {company_id}.conversations
            WHERE phone_number = %s AND instance_name = %s
        """
        result = db.execute_query(query, (phone_number, instance_name))
        if result:
            return [dict(row) for row in result]
        return []
    except Exception as e:
        print(f"Error getting conversation by phone: {e}")
        return []

def add_new_message(company_id: str, conversation_id:str, sender_type:str, sender_email:str, content:str, extra:str):
    """Add a new message to a conversation"""
    try:
        query = f"""
            INSERT INTO {company_id}.messages (conversation_id, sender_type, sender_email, content, extra)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *
        """
        result = db.execute_insert(query, (conversation_id, sender_type, sender_email, content, extra))
        if result:
            return [dict(result)]
        return []
    except Exception as e:
        print(f"Error adding message: {e}")
        return []

def get_unanswered_conversations(company_id: str):
    """Get unanswered conversations"""
    try:
        query = f"""
            SELECT m.message_id, c.conversation_id, c.conversation_name, c.source, c.ai_reply,
                   m.sender_type, m.sender_email, m.content, m.created_at
            FROM {company_id}.conversations AS c
            JOIN LATERAL (
              SELECT *
              FROM {company_id}.messages AS msg
              WHERE msg.conversation_id = c.conversation_id
              ORDER BY msg.created_at DESC, msg.message_id DESC
              LIMIT 1
            ) AS m ON true
            WHERE m.sender_type = 'customer'
        """
        result = db.execute_query(query)
        if result:
            return [dict(row) for row in result]
        return []
    except Exception as e:
        print(f"Error getting unanswered conversations: {e}")
        return []

def get_all_messages(company_id: str, conversation_id: str):
    """Get all messages for a conversation"""
    try:
        query = f"SELECT * FROM {company_id}.messages WHERE conversation_id = %s ORDER BY created_at ASC"
        result = db.execute_query(query, (conversation_id,))
        if result:
            return [dict(row) for row in result]
        return []
    except Exception as e:
        print(f"Error getting messages: {e}")
        return []

def add_new_image(company_id:str, file_name:str, file_type:str, file_hash:str, full_path:str, status: str, match_field:str):
    """Add a new image"""
    try:
        query = f"""
            INSERT INTO {company_id}.images (file_name, file_type, file_hash, full_path, status, match_field)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
        """
        result = db.execute_insert(query, (file_name, file_type, file_hash, full_path, status, match_field))
        if result:
            return [dict(result)]
        return []
    except Exception as e:
        print(f"Error adding image: {e}")
        return []

def get_images_from_table(company_id:str, page_size:int = 50, page_start:int = 0):
    """Get paginated images"""
    try:
        query = f"""
            SELECT * FROM {company_id}.images
            ORDER BY created_at ASC
            LIMIT %s OFFSET %s
        """
        result = db.execute_query(query, (page_size, page_start))
        if result:
            return [dict(row) for row in result]
        return []
    except Exception as e:
        print(f"Error getting images: {e}")
        return []

def get_all_image_from_table(company_id:str):
    """Get count of all images"""
    try:
        query = f"SELECT count(*) as count FROM {company_id}.images"
        result = db.execute_query(query)
        if result:
            return [dict(result[0])]
        return []
    except Exception as e:
        print(f"Error getting image count: {e}")
        return []

def get_same_image_from_table(company_id:str, file_hash:str):
    """Get image by file hash"""
    try:
        query = f"SELECT * FROM {company_id}.images WHERE file_hash = %s"
        result = db.execute_query(query, (file_hash,))
        if result:
            return [dict(row) for row in result]
        return []
    except Exception as e:
        print(f"Error getting image by hash: {e}")
        return []

def get_same_image_from_table_with_id(company_id:str, file_id:str):
    """Get image by ID"""
    try:
        query = f"SELECT * FROM {company_id}.images WHERE id = %s"
        result = db.execute_query(query, (file_id,))
        if result:
            return [dict(result[0])]
        return []
    except Exception as e:
        print(f"Error getting image by ID: {e}")
        return []

def delete_image_from_table(company_id:str, file_id:str):
    """Delete an image"""
    try:
        query = f"DELETE FROM {company_id}.images WHERE id = %s"
        db.execute_delete(query, (file_id,))
        return True
    except Exception as e:
        print(f"Error deleting image: {e}")
        return False

def update_image_status_on_table(company_id:str, file_id:str, status:str):
    """Update image status"""
    try:
        query = f"UPDATE {company_id}.images SET status = %s WHERE id = %s RETURNING *"
        result = db.execute_update(query, (status, file_id))
        if result:
            return [dict(result)]
        return []
    except Exception as e:
        print(f"Error updating image status: {e}")
        return []

def update_image_status_on_table_by_hash(company_id:str, file_hash:str, status:str):
    """Update image status"""
    try:
        query = f"UPDATE {company_id}.images SET status = %s WHERE file_hash = %s RETURNING *"
        result = db.execute_update(query, (status, file_hash))
        if result:
            return [dict(result)]
        return []
    except Exception as e:
        print(f"Error updating image status: {e}")
        return []

# Extra
def add_new_document(company_id:str, file_name:str, file_type:str, file_hash:str, full_path:str, status: str, match_field:str):
    """Add a new document"""
    try:
        query = f"""
            INSERT INTO {company_id}.documents (file_name, file_type, file_hash, full_path, status, match_field)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
        """
        result = db.execute_insert(query, (file_name, file_type, file_hash, full_path, status, match_field))
        if result:
            return [dict(result)]
        return []
    except Exception as e:
        print(f"Error adding image: {e}")
        return []

def get_documents_from_table(company_id:str, page_size:int = 50, page_start:int = 0):
    """Get paginated documents"""
    try:
        query = f"""
            SELECT * FROM {company_id}.documents
            ORDER BY created_at ASC
            LIMIT %s OFFSET %s
        """
        result = db.execute_query(query, (page_size, page_start))
        if result:
            return [dict(row) for row in result]
        return []
    except Exception as e:
        print(f"Error getting images: {e}")
        return []

def get_all_documents_from_table(company_id:str):
    """Get count of all documents"""
    try:
        query = f"SELECT count(*) as count FROM {company_id}.documents"
        result = db.execute_query(query)
        if result:
            return [dict(result[0])]
        return []
    except Exception as e:
        print(f"Error getting image count: {e}")
        return []

def get_same_documents_from_table(company_id:str, file_hash:str):
    """Get image by file hash"""
    try:
        query = f"SELECT * FROM {company_id}.documents WHERE file_hash = %s"
        result = db.execute_query(query, (file_hash,))
        if result:
            return [dict(row) for row in result]
        return []
    except Exception as e:
        print(f"Error getting image by hash: {e}")
        return []

def get_same_documents_from_table_with_id(company_id:str, file_id:str):
    """Get image by ID"""
    try:
        query = f"SELECT * FROM {company_id}.documents WHERE id = %s"
        result = db.execute_query(query, (file_id,))
        if result:
            return [dict(result[0])]
        return []
    except Exception as e:
        print(f"Error getting image by ID: {e}")
        return []

def delete_documents_from_table(company_id:str, file_id:str):
    """Delete an image"""
    try:
        query = f"DELETE FROM {company_id}.documents WHERE id = %s"
        db.execute_delete(query, (file_id,))
        return True
    except Exception as e:
        print(f"Error deleting image: {e}")
        return False

def update_documents_status_on_table(company_id:str, file_id:str, status:str):
    """Update image status"""
    try:
        query = f"UPDATE {company_id}.documents SET status = %s WHERE id = %s RETURNING *"
        result = db.execute_update(query, (status, file_id))
        if result:
            return [dict(result)]
        return []
    except Exception as e:
        print(f"Error updating image status: {e}")
        return []

def update_documents_status_on_table_by_hash(company_id:str, file_hash:str, status:str):
    """Update image status"""
    try:
        query = f"UPDATE {company_id}.documents SET status = %s WHERE file_hash = %s RETURNING *"
        result = db.execute_update(query, (status, file_hash))
        if result:
            return [dict(result)]
        return []
    except Exception as e:
        print(f"Error updating image status: {e}")
        return []

def get_linked_images_from_table(company_id:str, product_id:str):
    """Get linked images for a product"""
    try:
        query = f"""
            SELECT * FROM {company_id}.images
            WHERE file_name LIKE %s
            LIMIT 1
        """
        result = db.execute_query(query, (f"%{product_id}.%",))
        if result:
            return [dict(row) for row in result]
        return []
    except Exception as e:
        print(f"Error getting linked images: {e}")
        return []

def add_new_knowledge(company_id: str, file_name: str, file_type: str, file_hash: str, full_path:str, status: str, primary_column: str, extra: str):
    """Add a new knowledge"""
    try:
        query = f"""
            INSERT INTO {company_id}.knowledges (file_name, file_type, file_hash, full_path, status, primary_column, extra)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """
        result = db.execute_insert(query, (file_name, file_type, file_hash, full_path, status, primary_column, extra))
        if result:
            return [dict(result)]
        return []
    except Exception as e:
        print(f"Error adding knowledge: {e}")
        return []

def get_all_knowledges(company_id: str):
    """Get all knowledges"""
    try:
        query = f"SELECT * FROM {company_id}.knowledges"
        result = db.execute_query(query)
        if result:
            return [dict(row) for row in result]
        return []
    except Exception as e:
        print(f"Error getting knowledges: {e}")
        return []

def get_knowledge_by_id(company_id: str, knowledge_id: str):
    """Get a specific knowledge by ID"""
    try:
        query = f"SELECT * FROM {company_id}.knowledges WHERE id = %s"
        result = db.execute_query(query, (knowledge_id,))
        if result:
            return [dict(result[0])]
        return []
    except Exception as e:
        print(f"Error getting knowledge: {e}")
        return []

def get_knowledge_by_file_hash(company_id: str, file_hash: str):
    """Get a specific knowledge by ID"""
    try:
        query = f"SELECT * FROM {company_id}.knowledges WHERE file_hash = %s"
        result = db.execute_query(query, (file_hash,))
        if result:
            return [dict(result[0])]
        return []
    except Exception as e:
        print(f"Error getting knowledge: {e}")
        return []

def update_knowledge_status_by_id(company_id: str, knowledge_id: str, status: str):
    """Update knowledge status"""
    try:
        query = f"UPDATE {company_id}.knowledges SET status = %s WHERE id = %s RETURNING *"
        result = db.execute_update(query, (status, knowledge_id))
        if result:
            return [dict(result)]
        return []
    except Exception as e:
        print(f"Error updating knowledge: {e}")
        return []

def delete_knowledge_by_id(company_id: str, knowledge_id: str):
    """Delete a knowledge"""
    try:
        query = f"DELETE FROM {company_id}.knowledges WHERE id = %s"
        db.execute_delete(query, (knowledge_id,))
        return True
    except Exception as e:
        print(f"Error deleting knowledge: {e}")
        return False