import chromadb
from openai import OpenAI
import os

OPENAI_KEY = os.getenv("OPENAI_API_KEY", "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")

# Initialize ChromaDB client (local persistent storage)
chroma_client = chromadb.PersistentClient(path="./chroma_data")
openai_service: OpenAI = OpenAI(api_key=OPENAI_KEY)