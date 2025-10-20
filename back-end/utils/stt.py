from openai import OpenAI
import os
import io

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_KEY)

def speech_to_text(audio_file:io.BytesIO):
    translation = client.audio.translations.create(
        model="whisper-1", 
        file=audio_file,
    )
    
    return translation.text