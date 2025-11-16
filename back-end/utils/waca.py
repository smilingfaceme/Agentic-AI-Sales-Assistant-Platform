import os, json
import requests
import hashlib

BACKEND_URL = os.getenv('BACKEND_URL')

def send_text_message_by_waca(api_key:str, phone_number_id:str, to:str, content:str):
    try:
        version = "v24.0"
        url = f"https://graph.facebook.com/{version}/{phone_number_id}/messages"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        body = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "text",
            "text": {
                "preview_url": False,
                "body": content
            }
        }
        
        response = requests.post(url, headers=headers, data=json.dumps(body), timeout=10)
        if response.status_code == 200:
            return {
                "success": True,
                "data": response.json()
            }
        else:
            return {
                "success": False, 
                "error": response.json().get("error", {}).get("message", "") or "Failed Authorization",
                "data" : response.json()
            }
    except Exception as e:
        print("❌ Error:", e)
        return {
            "success": False,
            "error": "WhatsApp is currently experiencing an issue. Please try again shortly." 
        }

def send_image_message_by_waca(api_key:str, phone_number_id:str, to:str, content:str, extra_info:dict):
    try:
        version = "v24.0"
        url = f"https://graph.facebook.com/{version}/{phone_number_id}/messages"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        attachmentUrls = []
        for i in extra_info.get('images', []):
            url_i = f'{BACKEND_URL}/api/{i}'
            attachmentUrls.append({"url":url_i, "type":'image'})
        for i in extra_info.get("extra", []):
            url_i = f'{BACKEND_URL}/api/{i}'
            attachmentUrls.append({"url":url_i, "type":'document'})
            
        for i, attachment in enumerate(attachmentUrls):
            file_content = ""
            if i == len(attachmentUrls) - 1:
                file_content = content
            if attachment["type"] == "image":
                body = {
                    "messaging_product": "whatsapp",
                    "recipient_type": "individual",
                    "to": to,
                    "type": "image",
                    "image": {
                        "link": attachment["url"],
                        "caption": file_content
                    }
                }
                response = requests.post(url, headers=headers, data=json.dumps(body), timeout=10)
                if response.status_code != 200:
                    return {
                        "success": False, 
                        "error": response.json().get("error", {}).get("message", "") or "Failed Authorization",
                        "data" : response.json()
                    }
            elif attachment["type"] == "document":
                body = {
                    "messaging_product": "whatsapp",
                    "recipient_type": "individual",
                    "to": to,
                    "type": "document",
                    "document": {
                        "link": attachment["url"],
                        "caption": file_content
                    }
                }
                response = requests.post(url, headers=headers, data=json.dumps(body), timeout=10)
                if response.status_code != 200:
                    return {
                        "success": False, 
                        "error": response.json().get("error", {}).get("message", "") or "Failed Authorization",
                        "data" : response.json()
                    }
        
        return {
            "success": True,
            "data": "Send all successfully"
        }
    except Exception as e:
        print("❌ Error:", e)
        return {
            "success": False,
            "error": "WhatsApp is currently experiencing an issue. Please try again shortly." 
        }

def get_phone_numbers_info(api_key: str, phone_number_id: str) -> dict:
    """
    Get phone number information from WhatsApp Business API.

    Args:
        api_key: The access token for authentication
        phone_number_id: The phone number ID to query

    Returns:
        dict: JSON response from the API
    """
    try:
        version = "v24.0"
        url = f"https://graph.facebook.com/{version}/{phone_number_id}"

        params = {
            "access_token": api_key
        }

        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            return {
                "success": True,
                "data": response.json()
            }
        else:
            return {
                "success": False, 
                "error": response.json().get("error", {}).get("message", "") or "Failed Authorization",
                "data" : response.json()
            }
    except Exception as e:
        print("❌ Error:", e)
        return {
            "success": False,
            "error": "WhatsApp is currently experiencing an issue. Please try again shortly." 
        }

def regsiter_whatsapp_phone(api_key:str, phone_number_id:str):
    try:
        version = "v24.0"
        url = f"https://graph.facebook.com/{version}/{phone_number_id}/register"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        body = {
            "messaging_product": "whatsapp",
            "pin": 839202
        }
        
        response = requests.post(url, headers=headers, data=json.dumps(body))
        if response.status_code == 200:
            return {
                "success": True,
            }
        else:
            return {
                "success": False, 
                "error": response.json().get("error", {}).get("message", "") or "Failed Authorization",
                "data" : response.json()
            }
    except Exception as e:
        print("❌ Error:", e)
        return {
            "success": False,
            "error": "WhatsApp is currently experiencing an issue. Please try again shortly." 
        }

def confirm_phone_number_id(api_key:str, phone_number_id:str) -> dict:
    phone_number_info = get_phone_numbers_info(api_key, phone_number_id)
    if not phone_number_info["success"]:
        return phone_number_info
    print("Pass", phone_number_info)
    
    test_message_result = send_text_message_by_waca(api_key, phone_number_id, "19202599368", f'New Phone Integrated: {phone_number_info["data"]}')
    if test_message_result["success"]:
        return phone_number_info
    
    
    if "Account not registered" in test_message_result["data"].get("error", {}).get("message", "") and "VERIFIED" in phone_number_info["data"].get("code_verification_status", ""):
        register_result = regsiter_whatsapp_phone(api_key, phone_number_id)
        if register_result["success"]:
            second_test_message_result = send_text_message_by_waca(api_key, phone_number_id, "19202599368", f'New Phone Integrated: {phone_number_info["data"]}')
            if second_test_message_result["success"]:
                return phone_number_info
            else:
                return second_test_message_result
        else:
            return register_result
     
    return test_message_result

