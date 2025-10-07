from typing import List, Dict, Any, Optional
from src.service_client import pinecone_service
from src.utils.embedding_utills import generate_embeddings
from pinecone import ServerlessSpec

EMBEDDING_DIMENSION = 1536
spec = ServerlessSpec(cloud="aws", region="us-east-1")

def create_index(index_name: str):
    """Create Pinecone index if it doesn't exist"""
    if not pinecone_service.has_index(index_name):
        # if does not exist, create index
        pinecone_service.create_index(
            index_name,
            dimension=EMBEDDING_DIMENSION,  # dimensionality of text-embed-3-small
            metric='dotproduct',
            spec=spec
        )

def store_vectors_in_pinecone(index_name: str, chunks: List[Dict[str, Any]], embeddings: List[List[float]]):
    """
    Store vectors in Pinecone with metadata
    
    Args:
        index_name: Name of Pinecone index
        chunks: List of text chunks with metadata
        embeddings: List of embedding vectors
    """
    try:
        index = pinecone_service.Index(index_name)
        
        # Prepare vectors for upsert
        vectors = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            vector = {
                "id": chunk["metadata"]["chunk_id"],
                "values": embedding,
                "metadata": {
                    **chunk["metadata"],
                    "text": chunk["text"] # Store truncated text in metadata
                }
            }
            vectors.append(vector)
        
        # Upsert vectors in batches
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            index.upsert(vectors=batch)
            
        return True
    except Exception as e:
        raise Exception(f"Error storing vectors in Pinecone: {str(e)}")

def delete_file_vectors(index_name: str, file_hash: str):
    """
    Delete all vectors for a specific file from Pinecone
    
    Args:
        index_name: Name of Pinecone index
        file_hash: Hash of the file to delete
    """
    try:
        index = pinecone_service.Index(index_name)
        
        # Query vectors with the file hash
        query_response = index.query(
            vector=[0] * EMBEDDING_DIMENSION,  # Dummy vector
            filter={"file_hash": file_hash},
            top_k=10000,  # Large number to get all matches
            include_metadata=True
        )
        
        # Extract IDs to delete
        ids_to_delete = [match.id for match in query_response.matches]
        
        if ids_to_delete:
            # Delete in batches
            batch_size = 1000
            for i in range(0, len(ids_to_delete), batch_size):
                batch = ids_to_delete[i:i + batch_size]
                index.delete(ids=batch)
                
        return len(ids_to_delete)
    except Exception as e:
        raise Exception(f"Error deleting file vectors: {str(e)}")

def search_vectors(index_name: str, query_text: str, company_id: str, top_k: int = 5, file_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Search for similar vectors in Pinecone
    
    Args:
        index_name: Name of Pinecone index
        query_text: Text to search for
        company_id: Company ID to filter by
        top_k: Number of results to return
        file_name: Optional file name to filter by
        
    Returns:
        Search results with metadata
    """
    try:
        # Generate embedding for query
        query_embedding = generate_embeddings([query_text])[0]
        
        # Prepare filter
        filter_dict = {"company_id": company_id}
        if file_name:
            filter_dict["file_name"] = file_name
        
        # Search in Pinecone
        index = pinecone_service.Index(index_name)
        results = index.query(
            vector=query_embedding,
            # filter=filter_dict,
            top_k=top_k,
            include_metadata=True
        )
        
        return results['matches']
        
    except Exception as e:
        return []
