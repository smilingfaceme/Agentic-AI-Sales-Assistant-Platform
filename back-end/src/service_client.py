from pinecone import Pinecone
from openai import OpenAI
import os

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_KEY = os.getenv("PINECONE_API_KEY")

pinecone_service: Pinecone = Pinecone(api_key=PINECONE_KEY)
openai_service: OpenAI = OpenAI(api_key=OPENAI_KEY)