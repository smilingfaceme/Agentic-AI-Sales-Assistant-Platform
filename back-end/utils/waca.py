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
            url_i = f'{BACKEND_URL}/{i}'
            attachmentUrls.append({"url":url_i, "type":'image'})
        for i in extra_info.get("extra", []):
            url_i = f'{BACKEND_URL}/{i}'
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
                        "filename": attachment["url"].split("/")[-1],
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

def get_media_with_id(api_key:str, phone_number_id:str, media_id:str):
    try:
        version = "v24.0"
        url = f"https://graph.facebook.com/{version}//{media_id}?phone_number_id={phone_number_id}"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
                
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            return {
                "success": True,
                "data": response.json()
            }
        else:
            return {
                "success": False, 
                "error": response.json().get("error", {}).get("message", "") or "Failed Retrieve Media URL",
            }
    except Exception as e:
        print("❌ Error:", e)
        return {
            "success": False,
            "error": "WhatsApp is currently experiencing an issue. Please try again shortly." 
        }

def download_whatsapp_media(media_url: str, api_key: str, output_file: str):
    headers = {
        "Authorization": f"Bearer {api_key}"
    }

    if not media_url.startswith(('https://', 'http://')):
        raise ValueError("Invalid URL: must start with 'https://' or 'http://'")
    response = requests.get(media_url, headers=headers, stream=True)

    if response.status_code != 200:
        return False
    
    if "../" in output_file or "..\\" in output_file:
        raise Exception("Invalid file path")
    
    with open(output_file, "wb") as f:
        for chunk in response.iter_content(1024):
            f.write(chunk)

    return True

def logout_waca(api_key: str, waba_id: str):
    try:
        version = "v24.0"
        url = f"https://graph.facebook.com/{version}/{waba_id}/subscribed_apps"

        params = {
            "access_token": api_key
        }

        response = requests.delete(url, params=params, timeout=10)
        if response.status_code == 200:
            return {
                "success": True,
                "data": response.json()
            }
        else:
            return {
                "success": False, 
                "error": response.json().get("error", {}).get("message", "") or "Failed Logout",
                "data" : response.json()
            }
    except Exception as e:
        print("❌ Error:", e)
        return {
            "success": False,
            "error": "WhatsApp is currently experiencing an issue. Please try again shortly." 
        }