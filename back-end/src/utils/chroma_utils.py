from typing import List, Dict, Any, Optional
from src.service_client import chroma_client
from src.utils.embedding_utills import generate_embeddings
from langchain_openai import ChatOpenAI
import numpy as np
import os, json

# -------------------------------------------------------------------
# Configuration
# -------------------------------------------------------------------

OPENAI_KEY = os.getenv("OPENAI_API_KEY")

# Initialize the language model
llm_bot = ChatOpenAI(
    model=os.getenv('OPENAI_MODEL', 'gpt-4o-mini'),
    api_key=OPENAI_KEY
)

# Default embedding vector dimension for "text-embedding-3-small"
EMBEDDING_DIMENSION = 1536

vectors_for_each_conversation = {}

# -------------------------------------------------------------------
# Index Management
# -------------------------------------------------------------------

def create_index(index_name: str):
    """
    Create a ChromaDB collection if it doesn't already exist.
    
    Args:
        index_name (str): Name of the collection to create.
    """
    try:
        # ChromaDB automatically creates collections if they don't exist
        # when you call get_or_create_collection
        chroma_client.get_or_create_collection(
            name=index_name,
            metadata={"hnsw:space": "cosine"}
        )
    except Exception as e:
        raise Exception(f"Error creating ChromaDB collection: {str(e)}")


# -------------------------------------------------------------------
# Vector Storage
# -------------------------------------------------------------------

def store_vectors_in_chroma(index_name: str, chunks: List[Dict[str, Any]], embeddings: List[List[float]]):
    """
    Store text embeddings in a ChromaDB collection with metadata.
    
    Args:
        index_name (str): Name of the ChromaDB collection.
        chunks (List[Dict[str, Any]]): List of text chunks containing metadata.
        embeddings (List[List[float]]): Corresponding list of embedding vectors.
        
    Returns:
        bool: True if successful, raises exception otherwise.
    """
    try:
        collection = chroma_client.get_or_create_collection(
            name=index_name,
            metadata={"hnsw:space": "cosine"}
        )
        
        # Prepare data for ChromaDB
        ids = []
        documents = []
        metadatas = []
        vectors = []
        
        for chunk, embedding in zip(chunks, embeddings):
            ids.append(chunk["metadata"]["pc_chunk_id"])
            documents.append(chunk["text"])
            metadatas.append({
                **chunk["metadata"],
                "pc_text": chunk["text"]
            })
            vectors.append(embedding)
        
        # Add to collection in batches of 200 for performance
        batch_size = 200
        for i in range(0, len(ids), batch_size):
            collection.add(
                ids=ids[i:i + batch_size],
                documents=documents[i:i + batch_size],
                metadatas=metadatas[i:i + batch_size],
                embeddings=vectors[i:i + batch_size]
            )
        
        return True
    
    except Exception as e:
        raise Exception(f"Error storing vectors in ChromaDB: {str(e)}")


# -------------------------------------------------------------------
# Vector Deletion
# -------------------------------------------------------------------

def delete_file_vectors(index_name: str, file_hash: str):
    """
    Delete all vectors related to a specific file from ChromaDB.
    
    Args:
        index_name (str): Name of the ChromaDB collection.
        file_hash (str): Hash identifier of the file.
        
    Returns:
        int: Number of deleted vectors.
    """
    try:
        collection = chroma_client.get_or_create_collection(name=index_name)
        
        # Query for all vectors associated with this file hash
        results = collection.get(
            where={"pc_file_hash": file_hash}
        )
        
        ids_to_delete = results["ids"]
        
        # Delete in manageable batches
        if ids_to_delete:
            batch_size = 1000
            for i in range(0, len(ids_to_delete), batch_size):
                collection.delete(ids=ids_to_delete[i:i + batch_size])
        
        return len(ids_to_delete)
    
    except Exception as e:
        raise Exception(f"Error deleting file vectors: {str(e)}")


# -------------------------------------------------------------------
# Vector Search
# -------------------------------------------------------------------

def search_vectors_by_embedding(index_name: str, company_id: str, query_embedding: List[float] = None, file_name: Optional[str] = None, extra_filter: Optional[dict] = None) -> List[Dict[str, Any]]:
    """
    Search ChromaDB collection for similar vectors.

    Args:
        index_name (str): Name of ChromaDB collection.
        query_embedding (List[float]): Query embedding vector.
        company_id (str): Company ID to filter by.
        file_name (Optional[str]): Optional file filter.

    Returns:
        List[Dict[str, Any]]: Search results containing metadata and similarity scores.
    """
    try:
        if query_embedding is None:
            query_embedding = [0] * EMBEDDING_DIMENSION

        collection = chroma_client.get_or_create_collection(name=index_name)

        # Build filter dict
        filter_dict = {}
        if file_name:
            filter_dict["pc_file_name"] = file_name
        if extra_filter:
            filter_dict = {**filter_dict, **extra_filter}

        print("HELLO -/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-")
        print(filter_dict)

        # Query ChromaDB
        where_filter = filter_dict if filter_dict else None
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=100,
            where=where_filter,
            include=["embeddings", "metadatas", "documents", "distances"]
        )

        # Transform results to match Pinecone format
        matches = []
        if results["ids"] and len(results["ids"]) > 0:
            for i, id_ in enumerate(results["ids"][0]):
                # ChromaDB returns distances, convert to similarity scores
                # For cosine distance: similarity = 1 - distance
                distance = results["distances"][0][i]
                similarity_score = 1 - distance

                matches.append({
                    "id": id_,
                    "score": similarity_score,
                    "values": results["embeddings"][0][i] if results["embeddings"] else None,
                    "metadata": results["metadatas"][0][i],
                    "document": results["documents"][0][i]
                })

        return matches

    except Exception as e:
        print(f"Error searching vectors: {str(e)}")
        return []


def search_vectors(index_name: str, company_id: str, query_text: str = None, top_k: int = 100, file_name: Optional[str] = None, extra_filter: Optional[dict] = None) -> Dict[str, Any]:
    """
    Search ChromaDB collection using query text (wrapper for router compatibility).

    Args:
        index_name (str): Name of ChromaDB collection.
        company_id (str): Company ID to filter by.
        query_text (str): Query text to search for.
        top_k (int): Number of results to return.
        file_name (Optional[str]): Optional file filter.

    Returns:
        Dict[str, Any]: Search results with status and data.
    """
    try:
        # Generate embedding from query text
        if query_text:
            query_embedding = generate_embeddings([query_text])[0]
        else:
            query_embedding = [0] * EMBEDDING_DIMENSION

        # Search using embedding
        results = search_vectors_by_embedding(
            index_name=index_name,
            company_id=company_id,
            query_embedding=query_embedding,
            file_name=file_name,
            extra_filter=extra_filter
        )

        # Return top_k results
        return {
            "status": "success",
            "data": results[:top_k],
            "count": len(results[:top_k])
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "data": []
        }


def find_defferent_features(product_vectors: list[dict]):
    """Find differentiating features among products."""
    if not product_vectors:
        return {}
    
    common_keys = set(product_vectors[0]).intersection(*map(set, product_vectors[1:]))
    diff_values = {}
    for key in common_keys:
        values = {d[key] for d in product_vectors}
        if len(values) > 1:
            diff_values[key] = list(values)
    
    result = {}
    for i in diff_values.keys():
        if len(diff_values[i]) < len(product_vectors):
            result[i] = diff_values[i]
    
    return result


# -------------------------------------------------------------------
# Feature Extraction (LLM Analysis)
# -------------------------------------------------------------------

def extract_differentiating_features(retrieved_items: List[Dict], query: str) -> Optional[Dict]:
    """
    Use LLM to identify top differentiating product features.
    
    Args:
        retrieved_items (List[Dict]): List of ChromaDB search results with metadata.
        query (str): User query text.
    
    Returns:
        Optional[Dict]: Extracted differentiating features in JSON structure.
    """
    for i in retrieved_items:
        print(i.get('score', 'N/A'))
    
    text_result = [item["metadata"].get('pc_text', '') for item in retrieved_items]
    
    product_vectors = []
    for item in text_result:
        product = {}
        features = item.split("|")
        for f in features:
            k = f.split(":")
            key = k[0].strip()
            value = f.split(f'{key}:')[-1].strip()
            product[key] = value
        product_vectors.append(product)
    
    response_content = find_defferent_features(product_vectors)
    
    if len(response_content.keys()) <= 3:
        return None
    
    prompt_second = f"""
        You are given a dictionary of candidate product features and their possible values.
    Your task is to select the top 1 most important features that would be most helpful for a user to decide between products.

    Focus on features that:

    Strongly influence a user's buying decision (e.g., technical specs, physical properties, or standards).

    Clearly differentiate one product from another.

    Are relevant to how products are used or selected.

    Do not include internal system fields or IDs (e.g., ITEM_CATALOG_GROUP_ID, PARENT_DESC).
    Return your output in JSON format, with keys as feature names and values as their possible options.

    Features:
    {response_content}
    """
    
    response_second = llm_bot.invoke(prompt_second)
    response_second.content = response_second.content.replace("```", "").replace("json\n{", "{")
    
    try:
        features = json.loads(response_second.content)
    except Exception:
        features = None
    
    return features


# -------------------------------------------------------------------
# Maximal Marginal Relevance (MMR)
# -------------------------------------------------------------------

def mmr(query_vec, doc_vecs, lambda_param=0.7, top_k=5):
    """
    Apply Maximal Marginal Relevance (MMR) to diversify retrieval results.
    
    Args:
        query_vec (np.ndarray): Query embedding vector.
        doc_vecs (List[np.ndarray]): Document embedding vectors.
        lambda_param (float): Trade-off between relevance and diversity.
        top_k (int): Number of top results to select.
        
    Returns:
        List[int]: Indices of selected documents.
    """
    doc_vecs = np.array(doc_vecs)
    
    # Compute similarity between query and all documents
    similarities = np.dot(doc_vecs, query_vec) / (
        np.linalg.norm(doc_vecs, axis=1) * np.linalg.norm(query_vec)
    )
    
    selected = []
    for _ in range(top_k):
        if not selected:
            idx = np.argmax(similarities)
        else:
            # Compute similarity between selected and remaining docs
            sim_to_selected = np.max(
                np.dot(doc_vecs, doc_vecs[selected].T)
                / (np.linalg.norm(doc_vecs, axis=1)[:, None] * np.linalg.norm(doc_vecs[selected], axis=1)),
                axis=1
            )
            
            # Combine relevance and diversity
            mmr_score = lambda_param * similarities - (1 - lambda_param) * sim_to_selected
            idx = np.argmax(mmr_score)
        
        selected.append(idx)
    
    return selected


# -------------------------------------------------------------------
# Product Search Pipeline
# -------------------------------------------------------------------

def search_vectors_product(index_name: str, query_text: str, company_id: str, conversationId: str, new_search: str, top_k: int = 5, file_name: Optional[str] = None):
    """
    Perform product search using embeddings, MMR diversification, 
    and LLM-based feature differentiation.
    
    Args:
        index_name (str): ChromaDB collection name.
        query_text (str): User query text.
        company_id (str): Company ID filter.
        conversationId (str): Conversation ID for caching results.
        new_search (str): Whether this is a new search.
        top_k (int): Number of diverse top results.
        file_name (Optional[str]): Optional file name filter.
    
    Returns:
        Tuple[List[Dict], Optional[Dict]]:
            - diverse_results: Selected diverse product records
            - differentiating_features: Extracted distinguishing features
    """
    if new_search or vectors_for_each_conversation.get(conversationId, False) is False:
        # Step 1: Generate query embedding
        query_embedding = generate_embeddings([query_text])[0]

        # Step 2: Retrieve top matches from ChromaDB
        initial_results = search_vectors_by_embedding(index_name, company_id, query_embedding, file_name, {})
        
        if not initial_results:
            vectors_for_each_conversation[conversationId] = []
            return [], None
        doc_vectors = [r['values'] for r in initial_results if r.get('values') is not None]
        
        for i in initial_results:
            print(i.get('score', 'N/A'))
        print("=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/")
        
        # Step 3: Apply MMR for diverse selection
        if doc_vectors:
            selected_indices = mmr(query_embedding, doc_vectors, lambda_param=0.7, top_k=min(top_k, len(initial_results)))
            vectors_for_each_conversation[conversationId] = [initial_results[i] for i in selected_indices]
        else:
            vectors_for_each_conversation[conversationId] = initial_results[:top_k]
    
    search_vector_result = vectors_for_each_conversation.get(conversationId, [])
    
    # Step 4: Extract differentiating features
    differentiating_features = extract_differentiating_features(search_vector_result, query_text) if search_vector_result else None
    
    return search_vector_result, differentiating_features

