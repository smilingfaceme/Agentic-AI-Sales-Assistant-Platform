import os
import json
import threading
import asyncio
from fastapi import APIRouter, HTTPException, Request, Query
from db.public_table import get_companies, get_integration_by_phone_number_id
from db.company_table import (
    get_conversatin_by_phone_integration,
    add_new_conversation,
    add_new_message
)

router = APIRouter()

# Environment variable for webhook verification
WACA_VERIFY_TOKEN = os.getenv("WACA_VERIFY_TOKEN", "your_verify_token_here")


@router.get("/{phone_number_id}/webhook")
async def verify_webhook(
    phone_number_id: str,
    mode: str = Query(None, alias="hub.mode"),
    token: str = Query(None, alias="hub.verify_token"),
    challenge: str = Query(None, alias="hub.challenge")
):
    """
    Webhook verification endpoint for WhatsApp Business API.

    This endpoint is specific to each phone_number_id to support multiple accounts.
    WhatsApp will send a GET request with mode, verify_token, and challenge parameters.
    We need to verify the token and return the challenge to complete the verification.
    """
    # Verify that the phone_number_id exists in our system
    integration = get_integration_by_phone_number_id(phone_number_id)
    if not integration:
        print(f"❌ Webhook verification failed: No integration found for phone_number_id: {phone_number_id}")
        raise HTTPException(status_code=404, detail="Phone number ID not found")

    if mode == "subscribe" and token == integration["id"]:
        print(f"✅ Webhook verified successfully for phone_number_id: {phone_number_id}")
        return int(challenge)
    else:
        print(f"❌ Webhook verification failed for phone_number_id: {phone_number_id}")
        raise HTTPException(status_code=403, detail="Verification failed")
    

@router.post("/{phone_number_id}/webhook")
async def handle_webhook(phone_number_id: str, request: Request):
    """
    Handle incoming WhatsApp Business API webhook events.

    This endpoint is specific to each phone_number_id to support multiple accounts.
    It receives messages, status updates, and other events from WhatsApp.
    """
    try:
        body = await request.json()
        print(f"📩 Received webhook for phone_number_id {phone_number_id}:", json.dumps(body, indent=2))

        # Verify that the phone_number_id exists in our system
        integration = get_integration_by_phone_number_id(phone_number_id)
        if not integration:
            print(f"❌ No integration found for phone_number_id: {phone_number_id}")
            # Return 200 to prevent WhatsApp from retrying
            return {"status": "error", "message": "Phone number ID not found"}

        if not integration.get('is_active'):
            print(f"⚠️ Integration is not active for phone_number_id: {phone_number_id}")
            # Return 200 to prevent WhatsApp from retrying
            return {"status": "error", "message": "Integration is not active"}

        # Check if this is a message event
        if body.get("object") == "whatsapp_business_account":
            entries = body.get("entry", [])

            for entry in entries:
                changes = entry.get("changes", [])

                for change in changes:
                    value = change.get("value", {})

                    # Handle incoming messages
                    if "messages" in value:
                        messages = value.get("messages", [])
                        metadata = value.get("metadata", {})
                        webhook_phone_number_id = metadata.get("phone_number_id")

                        # Verify that the phone_number_id in the webhook matches the URL parameter
                        if webhook_phone_number_id != phone_number_id:
                            print(f"⚠️ Phone number ID mismatch: URL={phone_number_id}, Webhook={webhook_phone_number_id}")
                            # Still process the message using the URL parameter as the source of truth

                        for message in messages:
                            # Process message in background
                            thread = threading.Thread(
                                target=process_waca_message,
                                args=(message, phone_number_id)
                            )
                            thread.daemon = True
                            thread.start()

                    # Handle status updates (optional)
                    if "statuses" in value:
                        statuses = value.get("statuses", [])
                        for status in statuses:
                            print(f"📊 Message status update for {phone_number_id}: {status}")

        return {"status": "success"}

    except Exception as e:
        print(f"❌ Error processing webhook for phone_number_id {phone_number_id}: {e}")
        # Return 200 to prevent WhatsApp from retrying
        return {"status": "error", "message": str(e)}


def process_waca_message(message: dict, phone_number_id: str):
    """
    Process incoming WhatsApp message in a background thread.

    Args:
        message: The message object from WhatsApp
        phone_number_id: The phone number ID that received the message
    """
    asyncio.run(process_waca_message_async(message, phone_number_id))


async def process_waca_message_async(message: dict, phone_number_id: str):
    """
    Async function to process WhatsApp message.
    """
    try:
        from routers.chat import run_response_in_thread, run_response_for_image_in_thread
        import httpx
        import io

        # Get integration by phone_number_id
        integration = get_integration_by_phone_number_id(phone_number_id)
        if not integration:
            print(f"❌ No integration found for phone_number_id: {phone_number_id}")
            return

        if not integration.get('is_active'):
            print(f"⚠️ Integration is not active for phone_number_id: {phone_number_id}")
            return

        company_id = integration['company_id']
        api_key = integration['instance_name']  # API key is stored in instance_name for WACA

        # Get company info
        company_info = get_companies("id", company_id)
        if not company_info:
            print(f"❌ Company not found: {company_id}")
            return

        company_schema = company_info["schema_name"]

        # Extract message details
        from_number = message.get("from")
        message_type = message.get("type")
        message_id = message.get("id")
        timestamp = message.get("timestamp")

        # Extract message content based on type
        content = ""

        if message_type == "text":
            content = message.get("text", {}).get("body", "")

        elif message_type == "image":
            # Handle image messages
            image_data = message.get("image", {})
            image_id = image_data.get("id")
            caption = image_data.get("caption", "")
            content = caption or "Image received"

            # Download image and process
            # TODO: Implement image download and processing
            print(f"📷 Image message received: {image_id}")

        elif message_type == "audio" or message_type == "voice":
            # Handle voice messages
            audio_data = message.get("audio") or message.get("voice", {})
            audio_id = audio_data.get("id")
            content = "Voice message received"

            # TODO: Implement voice message download and transcription
            print(f"🎤 Voice message received: {audio_id}")

        elif message_type == "document":
            # Handle document messages
            document_data = message.get("document", {})
            document_id = document_data.get("id")
            filename = document_data.get("filename", "")
            caption = document_data.get("caption", "")
            content = caption or f"Document received: {filename}"

            print(f"📄 Document message received: {document_id}")

        else:
            print(f"⚠️ Unsupported message type: {message_type}")
            return

        # Get or create conversation
        conversation = get_conversatin_by_phone_integration(company_schema, from_number, phone_number_id)

        if not conversation:
            # Create new conversation
            contact_name = message.get("profile", {}).get("name", from_number)
            new_conversation = add_new_conversation(
                company_schema,
                contact_name,
                "WhatsApp",
                from_number,
                phone_number_id
            )

            if new_conversation:
                conversation_id = new_conversation[0]['conversation_id']
                conversation_ai_reply = new_conversation[0]['ai_reply']
            else:
                print(f"❌ Failed to create conversation")
                return
        else:
            conversation_id = conversation[0]['conversation_id']
            conversation_ai_reply = conversation[0]['ai_reply']

        # Add message to database
        messages = add_new_message(
            company_id=company_schema,
            conversation_id=conversation_id,
            sender_email="",
            sender_type="customer",
            content=content,
            extra='[]'
        )

        if not messages:
            print(f"❌ Failed to add message to database")
            return

        # Generate AI response if enabled
        if conversation_ai_reply:
            if message_type == "image":
                # TODO: Implement image response handling
                print("📷 Image response handling not yet implemented")
            else:
                # Generate text response
                thread = threading.Thread(
                    target=run_response_in_thread,
                    args=(
                        conversation_id,
                        company_id,
                        company_schema,
                        content,
                        phone_number_id,  # instance_name for WACA is phone_number_id
                        from_number,
                        "Text",
                        "WACA"  # Platform identifier for WACA
                    )
                )
                thread.daemon = True
                thread.start()

        print(f"✅ Message processed successfully: {message_id}")

    except Exception as e:
        print(f"❌ Error processing message: {e}")
        import traceback
        traceback.print_exc()
