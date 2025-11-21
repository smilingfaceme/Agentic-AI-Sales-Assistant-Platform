from typing import List
from src.service_client import openai_service

# Constants
EMBEDDING_MODEL = "text-embedding-3-small"

def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for list of texts using OpenAI
    
    Args:
        texts: List of text strings to embed
        
    Returns:
        List of embedding vectors
    """
    try:
        response = openai_service.embeddings.create(
            model=EMBEDDING_MODEL,
            input=texts
        )
        return [embedding.embedding for embedding in response.data]
    except Exception as e:
        raise Exception(f"Error generating embeddings: {str(e)}")