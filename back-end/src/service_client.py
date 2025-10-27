import chromadb
from openai import OpenAI
import os

OPENAI_KEY = os.getenv("OPENAI_API_KEY")

# Initialize ChromaDB client (local persistent storage)
chroma_client = chromadb.PersistentClient(path="./chroma_data")
openai_service: OpenAI = OpenAI(api_key=OPENAI_KEY)