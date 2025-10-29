"""
SQLAlchemy-based database functions for company-specific schema tables
"""
from db.db_connection import db
from models.schema import *
from sqlalchemy import text
import json
from uuid import UUID


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

        # Create documents table
        extra_query = COMPANY_EXTRA_TABLE.format(company_id=company_id)
        db.execute_raw(extra_query)

        # Create KNOWLEDGE table
        knowledge_query = COMPANY_KNOWLEDGE_TABLE.format(company_id=company_id)
        db.execute_raw(knowledge_query)

        return {"status": "success", "message": "Company tables created"}
    except Exception as e:
        print(f"Error creating company tables: {e}")
        return {"status": "error", "message": str(e)}

# ==================== CONVERSATIONS ====================

def add_new_conversation(company_id: str, conversation_name: str, source: str, phone_number: str, instance_name: str = ""):
    """Add a new conversation"""
    session = db.get_session()
    try:
        query = text(f"""
            INSERT INTO {company_id}.conversations (conversation_name, source, phone_number, instance_name)
            VALUES (:conversation_name, :source, :phone_number, :instance_name)
            RETURNING *
        """)
        result = session.execute(query, {
            "conversation_name": conversation_name,
            "source": source,
            "phone_number": phone_number,
            "instance_name": instance_name
        }).fetchone()
        session.commit()
        if result:
            return [dict(result._mapping)]
        return []
    except Exception as e:
        session.rollback()
        print(f"Error adding conversation: {e}")
        return []
    finally:
        session.close()


def toggle_ai_reply_for_conversation(company_id: str, conversation_id: str):
    """Toggle AI reply for a conversation"""
    session = db.get_session()
    try:
        query = text(f"""
            UPDATE {company_id}.conversations
            SET ai_reply = NOT ai_reply
            WHERE conversation_id = :conversation_id
            RETURNING *
        """)
        result = session.execute(query, {"conversation_id": conversation_id}).fetchone()
        session.commit()
        if result:
            return [dict(result._mapping)]
        return []
    except Exception as e:
        session.rollback()
        print(f"Error toggling AI reply: {e}")
        return []
    finally:
        session.close()


def get_all_conversations(company_id: str):
    """Get all conversations for a company"""
    session = db.get_session()
    try:
        from uuid import UUID
        query = text(f"SELECT * FROM {company_id}.conversations")
        results = session.execute(query).fetchall()
        if results:
            result_list = []
            for row in results:
                result_dict = dict(row._mapping)
                # Convert UUID objects to strings for JSON serialization
                for key, value in result_dict.items():
                    if isinstance(value, UUID):
                        result_dict[key] = str(value)
                result_list.append(result_dict)
            return result_list
        return []
    except Exception as e:
        print(f"Error getting conversations: {e}")
        return []
    finally:
        session.close()


def get_conversation_by_id(company_id: str, conversation_id: str):
    """Get a specific conversation by ID"""
    session = db.get_session()
    try:
        query = text(f"SELECT * FROM {company_id}.conversations WHERE conversation_id = :conversation_id")
        result = session.execute(query, {"conversation_id": conversation_id}).fetchone()
        if result:
            return [dict(result._mapping)]
        return []
    except Exception as e:
        print(f"Error getting conversation: {e}")
        return []
    finally:
        session.close()


def get_conversatin_by_phone_integration(company_id: str, phone_number: str, instance_name: str):
    """Get conversation by phone integration"""
    session = db.get_session()
    try:
        query = text(f"""
            SELECT * FROM {company_id}.conversations
            WHERE phone_number = :phone_number AND instance_name = :instance_name
        """)
        results = session.execute(query, {
            "phone_number": phone_number,
            "instance_name": instance_name
        }).fetchall()
        if results:
            return [dict(row._mapping) for row in results]
        return []
    except Exception as e:
        print(f"Error getting conversation by phone: {e}")
        return []
    finally:
        session.close()

# ==================== MESSAGES ====================

def add_new_message(company_id: str, conversation_id: str, sender_type: str, sender_email: str, content: str, extra: str):
    """Add a new message to a conversation"""
    session = db.get_session()
    try:
        query = text(f"""
            INSERT INTO {company_id}.messages (conversation_id, sender_type, sender_email, content, extra)
            VALUES (:conversation_id, :sender_type, :sender_email, :content, :extra)
            RETURNING *
        """)
        result = session.execute(query, {
            "conversation_id": conversation_id,
            "sender_type": sender_type,
            "sender_email": sender_email,
            "content": content,
            "extra": extra
        }).fetchone()
        session.commit()
        if result:
            return [dict(result._mapping)]
        return []
    except Exception as e:
        session.rollback()
        print(f"Error adding message: {e}")
        return []
    finally:
        session.close()


def get_unanswered_conversations(company_id: str):
    """Get unanswered conversations"""
    session = db.get_session()
    try:
        from uuid import UUID
        query = text(f"""
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
        """)
        results = session.execute(query).fetchall()
        if results:
            result_list = []
            for row in results:
                result_dict = dict(row._mapping)
                # Convert UUID objects to strings for JSON serialization
                for key, value in result_dict.items():
                    if isinstance(value, UUID):
                        result_dict[key] = str(value)
                result_list.append(result_dict)
            return result_list
        return []
    except Exception as e:
        print(f"Error getting unanswered conversations: {e}")
        return []
    finally:
        session.close()


def get_all_messages(company_id: str, conversation_id: str):
    """Get all messages for a conversation"""
    session = db.get_session()
    try:
        from uuid import UUID
        query = text(f"SELECT * FROM {company_id}.messages WHERE conversation_id = :conversation_id ORDER BY created_at ASC")
        results = session.execute(query, {"conversation_id": conversation_id}).fetchall()
        if results:
            result_list = []
            for row in results:
                result_dict = dict(row._mapping)
                # Convert UUID objects to strings for JSON serialization
                for key, value in result_dict.items():
                    if isinstance(value, UUID):
                        result_dict[key] = str(value)
                result_list.append(result_dict)
            return result_list
        return []
    except Exception as e:
        print(f"Error getting messages: {e}")
        return []
    finally:
        session.close()

# ==================== IMAGES ====================

def add_new_image(company_id: str, file_name: str, file_type: str, file_hash: str, full_path: str, status: str, match_field: str):
    """Add a new image"""
    session = db.get_session()
    try:
        query = text(f"""
            INSERT INTO {company_id}.images (file_name, file_type, file_hash, full_path, status, match_field)
            VALUES (:file_name, :file_type, :file_hash, :full_path, :status, :match_field)
            RETURNING *
        """)
        result = session.execute(query, {
            "file_name": file_name,
            "file_type": file_type,
            "file_hash": file_hash,
            "full_path": full_path,
            "status": status,
            "match_field": match_field
        }).fetchone()
        session.commit()
        if result:
            return [dict(result._mapping)]
        return []
    except Exception as e:
        session.rollback()
        print(f"Error adding image: {e}")
        return []
    finally:
        session.close()


def get_images_from_table(company_id: str, page_size: int = 50, page_start: int = 0):
    """Get paginated images"""
    session = db.get_session()
    try:
        query = text(f"""
            SELECT * FROM {company_id}.images
            ORDER BY created_at ASC
            LIMIT :page_size OFFSET :page_start
        """)
        results = session.execute(query, {"page_size": page_size, "page_start": page_start}).fetchall()
        if results:
            return [dict(row._mapping) for row in results]
        return []
    except Exception as e:
        print(f"Error getting images: {e}")
        return []
    finally:
        session.close()


def get_all_image_from_table(company_id: str):
    """Get count of all images"""
    session = db.get_session()
    try:
        query = text(f"SELECT count(*) as count FROM {company_id}.images")
        result = session.execute(query).fetchone()
        if result:
            return [dict(result._mapping)]
        return []
    except Exception as e:
        print(f"Error getting image count: {e}")
        return []
    finally:
        session.close()


def get_same_image_from_table(company_id: str, file_hash: str):
    """Get image by file hash"""
    session = db.get_session()
    try:
        from uuid import UUID
        query = text(f"SELECT * FROM {company_id}.images WHERE file_hash = :file_hash")
        results = session.execute(query, {"file_hash": file_hash}).fetchall()
        if results:
            result_list = []
            for row in results:
                result_dict = dict(row._mapping)
                # Convert UUID objects to strings for JSON serialization
                for key, value in result_dict.items():
                    if isinstance(value, UUID):
                        result_dict[key] = str(value)
                result_list.append(result_dict)
            return result_list
        return []
    except Exception as e:
        print(f"Error getting image by hash: {e}")
        return []
    finally:
        session.close()


def get_same_image_from_table_with_id(company_id: str, file_id: str):
    """Get image by ID"""
    session = db.get_session()
    try:
        query = text(f"SELECT * FROM {company_id}.images WHERE id = :file_id")
        result = session.execute(query, {"file_id": file_id}).fetchone()
        if result:
            return [dict(result._mapping)]
        return []
    except Exception as e:
        print(f"Error getting image by ID: {e}")
        return []
    finally:
        session.close()


def delete_image_from_table(company_id: str, file_id: str):
    """Delete an image"""
    session = db.get_session()
    try:
        query = text(f"DELETE FROM {company_id}.images WHERE id = :file_id")
        session.execute(query, {"file_id": file_id})
        session.commit()
        return True
    except Exception as e:
        session.rollback()
        print(f"Error deleting image: {e}")
        return False
    finally:
        session.close()


def update_image_status_on_table(company_id: str, file_id: str, status: str):
    """Update image status"""
    session = db.get_session()
    try:
        query = text(f"UPDATE {company_id}.images SET status = :status WHERE id = :file_id RETURNING *")
        result = session.execute(query, {"status": status, "file_id": file_id}).fetchone()
        session.commit()
        if result:
            return [dict(result._mapping)]
        return []
    except Exception as e:
        session.rollback()
        print(f"Error updating image status: {e}")
        return []
    finally:
        session.close()


def update_image_status_on_table_by_hash(company_id: str, file_hash: str, status: str):
    """Update image status by file hash"""
    session = db.get_session()
    try:
        query = text(f"UPDATE {company_id}.images SET status = :status WHERE file_hash = :file_hash RETURNING *")
        result = session.execute(query, {"status": status, "file_hash": file_hash}).fetchone()
        session.commit()
        if result:
            return [dict(result._mapping)]
        return []
    except Exception as e:
        session.rollback()
        print(f"Error updating image status: {e}")
        return []
    finally:
        session.close()

# ==================== DOCUMENTS ====================

def add_new_document(company_id: str, file_name: str, file_type: str, file_hash: str, full_path: str, status: str, match_field: str):
    """Add a new document"""
    session = db.get_session()
    try:
        query = text(f"""
            INSERT INTO {company_id}.documents (file_name, file_type, file_hash, full_path, status, match_field)
            VALUES (:file_name, :file_type, :file_hash, :full_path, :status, :match_field)
            RETURNING *
        """)
        result = session.execute(query, {
            "file_name": file_name,
            "file_type": file_type,
            "file_hash": file_hash,
            "full_path": full_path,
            "status": status,
            "match_field": match_field
        }).fetchone()
        session.commit()
        if result:
            return [dict(result._mapping)]
        return []
    except Exception as e:
        session.rollback()
        print(f"Error adding document: {e}")
        return []
    finally:
        session.close()


def get_documents_from_table(company_id: str, page_size: int = 50, page_start: int = 0):
    """Get paginated documents"""
    session = db.get_session()
    try:
        from uuid import UUID
        query = text(f"""
            SELECT * FROM {company_id}.documents
            ORDER BY created_at ASC
            LIMIT :page_size OFFSET :page_start
        """)
        results = session.execute(query, {"page_size": page_size, "page_start": page_start}).fetchall()
        if results:
            result_list = []
            for row in results:
                result_dict = dict(row._mapping)
                # Convert UUID objects to strings for JSON serialization
                for key, value in result_dict.items():
                    if isinstance(value, UUID):
                        result_dict[key] = str(value)
                result_list.append(result_dict)
            return result_list
        return []
    except Exception as e:
        print(f"Error getting documents: {e}")
        return []
    finally:
        session.close()


def get_all_documents_from_table(company_id: str):
    """Get count of all documents"""
    session = db.get_session()
    try:
        query = text(f"SELECT count(*) as count FROM {company_id}.documents")
        result = session.execute(query).fetchone()
        if result:
            return [dict(result._mapping)]
        return []
    except Exception as e:
        print(f"Error getting document count: {e}")
        return []
    finally:
        session.close()


def get_same_documents_from_table(company_id: str, file_hash: str):
    """Get documents by file hash"""
    session = db.get_session()
    try:
        from uuid import UUID
        query = text(f"SELECT * FROM {company_id}.documents WHERE file_hash = :file_hash")
        results = session.execute(query, {"file_hash": file_hash}).fetchall()
        if results:
            result_list = []
            for row in results:
                result_dict = dict(row._mapping)
                # Convert UUID objects to strings for JSON serialization
                for key, value in result_dict.items():
                    if isinstance(value, UUID):
                        result_dict[key] = str(value)
                result_list.append(result_dict)
            return result_list
        return []
    except Exception as e:
        print(f"Error getting document by hash: {e}")
        return []
    finally:
        session.close()


def get_same_documents_from_table_with_id(company_id: str, file_id: str):
    """Get document by ID"""
    session = db.get_session()
    try:
        from uuid import UUID
        query = text(f"SELECT * FROM {company_id}.documents WHERE id = :file_id")
        result = session.execute(query, {"file_id": file_id}).fetchone()
        if result:
            result_dict = dict(result._mapping)
            # Convert UUID objects to strings for JSON serialization
            for key, value in result_dict.items():
                if isinstance(value, UUID):
                    result_dict[key] = str(value)
            return [result_dict]
        return []
    except Exception as e:
        print(f"Error getting document by ID: {e}")
        return []
    finally:
        session.close()


def delete_documents_from_table(company_id: str, file_id: str):
    """Delete a document"""
    session = db.get_session()
    try:
        query = text(f"DELETE FROM {company_id}.documents WHERE id = :file_id")
        session.execute(query, {"file_id": file_id})
        session.commit()
        return True
    except Exception as e:
        session.rollback()
        print(f"Error deleting document: {e}")
        return False
    finally:
        session.close()


def update_documents_status_on_table(company_id: str, file_id: str, status: str):
    """Update document status"""
    session = db.get_session()
    try:
        query = text(f"UPDATE {company_id}.documents SET status = :status WHERE id = :file_id RETURNING *")
        result = session.execute(query, {"status": status, "file_id": file_id}).fetchone()
        session.commit()
        if result:
            return [dict(result._mapping)]
        return []
    except Exception as e:
        session.rollback()
        print(f"Error updating document status: {e}")
        return []
    finally:
        session.close()


def update_documents_status_on_table_by_hash(company_id: str, file_hash: str, status: str):
    """Update document status by file hash"""
    session = db.get_session()
    try:
        query = text(f"UPDATE {company_id}.documents SET status = :status WHERE file_hash = :file_hash RETURNING *")
        result = session.execute(query, {"status": status, "file_hash": file_hash}).fetchone()
        session.commit()
        if result:
            return [dict(result._mapping)]
        return []
    except Exception as e:
        session.rollback()
        print(f"Error updating document status: {e}")
        return []
    finally:
        session.close()


def get_linked_images_from_table(company_id: str, product_id: str):
    """Get linked images for a product"""
    session = db.get_session()
    try:
        query = text(f"""
            SELECT * FROM {company_id}.images
            WHERE file_name LIKE :product_id
            LIMIT 1
        """)
        results = session.execute(query, {"product_id": f"%{product_id}.%"}).fetchall()
        if results:
            return [dict(row._mapping) for row in results]
        return []
    except Exception as e:
        print(f"Error getting linked images: {e}")
        return []
    finally:
        session.close()

# ==================== KNOWLEDGES ====================

def add_new_knowledge(company_id: str, file_name: str, file_type: str, file_hash: str, full_path: str, status: str, primary_column: str, extra: str):
    """Add a new knowledge"""
    session = db.get_session()
    try:
        query = text(f"""
            INSERT INTO {company_id}.knowledges (file_name, file_type, file_hash, full_path, status, primary_column, extra)
            VALUES (:file_name, :file_type, :file_hash, :full_path, :status, :primary_column, :extra)
            RETURNING *
        """)
        result = session.execute(query, {
            "file_name": file_name,
            "file_type": file_type,
            "file_hash": file_hash,
            "full_path": full_path,
            "status": status,
            "primary_column": primary_column,
            "extra": extra
        }).fetchone()
        session.commit()
        if result:
            return [dict(result._mapping)]
        return []
    except Exception as e:
        session.rollback()
        print(f"Error adding knowledge: {e}")
        return []
    finally:
        session.close()


def get_all_knowledges(company_id: str):
    """Get all knowledges"""
    session = db.get_session()
    try:
        query = text(f"SELECT * FROM {company_id}.knowledges")
        results = session.execute(query).fetchall()
        if results:
            return [dict(row._mapping) for row in results]
        return []
    except Exception as e:
        print(f"Error getting knowledges: {e}")
        return []
    finally:
        session.close()


def get_knowledge_by_id(company_id: str, knowledge_id: str):
    """Get a specific knowledge by ID"""
    session = db.get_session()
    try:
        query = text(f"SELECT * FROM {company_id}.knowledges WHERE id = :knowledge_id")
        result = session.execute(query, {"knowledge_id": knowledge_id}).fetchone()
        if result:
            return [dict(result._mapping)]
        return []
    except Exception as e:
        print(f"Error getting knowledge: {e}")
        return []
    finally:
        session.close()


def get_knowledge_by_file_hash(company_id: str, file_hash: str):
    """Get a specific knowledge by file hash"""
    session = db.get_session()
    try:
        query = text(f"SELECT * FROM {company_id}.knowledges WHERE file_hash = :file_hash")
        result = session.execute(query, {"file_hash": file_hash}).fetchone()
        if result:
            return [dict(result._mapping)]
        return []
    except Exception as e:
        print(f"Error getting knowledge: {e}")
        return []
    finally:
        session.close()


def update_knowledge_status_by_id(company_id: str, knowledge_id: str, status: str):
    """Update knowledge status"""
    session = db.get_session()
    try:
        query = text(f"UPDATE {company_id}.knowledges SET status = :status WHERE id = :knowledge_id RETURNING *")
        result = session.execute(query, {"status": status, "knowledge_id": knowledge_id}).fetchone()
        session.commit()
        if result:
            return [dict(result._mapping)]
        return []
    except Exception as e:
        session.rollback()
        print(f"Error updating knowledge: {e}")
        return []
    finally:
        session.close()


def delete_knowledge_by_id(company_id: str, knowledge_id: str):
    """Delete a knowledge"""
    session = db.get_session()
    try:
        query = text(f"DELETE FROM {company_id}.knowledges WHERE id = :knowledge_id")
        session.execute(query, {"knowledge_id": knowledge_id})
        session.commit()
        return True
    except Exception as e:
        session.rollback()
        print(f"Error deleting knowledge: {e}")
        return False
    finally:
        session.close()