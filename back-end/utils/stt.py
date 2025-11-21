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

def speech_to_text_with_path(file_path: str):
    with open(file_path, "rb") as audio_file:
        translation = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file
        )
    return translation.text