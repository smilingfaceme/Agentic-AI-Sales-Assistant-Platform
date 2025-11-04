import os
import httpx
import hashlib

WhatsApp_Bot_URL = os.getenv("WhatsApp_Bot_URL")
SUPABASE_URL = os.getenv('SUPABASE_URL')
BACKEND_URL = os.getenv('BACKEND_URL')

def combine_uuids(uuid1: str, uuid2: str, order:int) -> str:
    combined = uuid1 + uuid2 + str(order)
    # SHA256 ensures uniqueness, then we cut down
    hash_str = hashlib.sha256(combined.encode()).hexdigest()
    return hash_str

async def start_whatsapp(company_id: str, request_id:str, instance_name:str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{WhatsApp_Bot_URL}/start",
            json={
                "company_id": company_id,
                "request_id": request_id,
                "instance_name": instance_name
            }
        )
        print(response)
    return response.json()

async def logout_whatsapp(instance_name:str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{WhatsApp_Bot_URL}/logout",
            json={
                "instance_name": instance_name
            }
        )
    return response.json()

async def send_message_whatsapp(instance_name:str, to:str, message:str, extra_info:dict):
    image_urls = []
    extra_urls = []
    for i in extra_info.get('images', []):
        url_i = f'{BACKEND_URL}/{i}'
        image_urls.append(url_i)
    for i in extra_info.get("extra", []):
        url_i = f'{BACKEND_URL}/{i}'
        extra_urls.append(url_i)
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{WhatsApp_Bot_URL}/send",
            json={
                "project_id": instance_name,
                'to': to,
                'message': message,
                'image_urls': image_urls,
                'extra_urls': extra_urls
            }
        )
        if response.status_code > 300:
            return False
        return response.json()