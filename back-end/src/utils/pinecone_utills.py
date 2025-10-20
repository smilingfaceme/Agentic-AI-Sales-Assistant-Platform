from typing import List, Dict, Any, Optional
from src.service_client import pinecone_service
from src.utils.embedding_utills import generate_embeddings
from pinecone import ServerlessSpec
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

# Pinecone serverless specification
spec = ServerlessSpec(cloud="aws", region="us-east-1")

vectors_for_each_conversation = {}
# -------------------------------------------------------------------
# Index Management
# -------------------------------------------------------------------

def create_index(index_name: str):
    """
    Create a Pinecone index if it doesn't already exist.
    
    Args:
        index_name (str): Name of the index to create.
    """
    if not pinecone_service.has_index(index_name):
        pinecone_service.create_index(
            index_name,
            dimension=EMBEDDING_DIMENSION,  # dimensionality of text-embed-3-small
            metric='dotproduct',
            spec=spec
        )


# -------------------------------------------------------------------
# Vector Storage
# -------------------------------------------------------------------

def store_vectors_in_pinecone(index_name: str, chunks: List[Dict[str, Any]], embeddings: List[List[float]]):
    """
    Store text embeddings in a Pinecone index with metadata.
    
    Args:
        index_name (str): Name of the Pinecone index.
        chunks (List[Dict[str, Any]]): List of text chunks containing metadata.
        embeddings (List[List[float]]): Corresponding list of embedding vectors.
        
    Returns:
        bool: True if successful, raises exception otherwise.
    """
    try:
        index = pinecone_service.Index(index_name)
        vectors = []

        # Prepare data for upsert
        for chunk, embedding in zip(chunks, embeddings):
            vectors.append({
                "id": chunk["metadata"]["pc_chunk_id"],
                "values": embedding,
                "metadata": {
                    **chunk["metadata"],
                    "pc_text": chunk["text"]
                }
            })

        # Upsert in batches of 200 for performance
        batch_size = 200
        for i in range(0, len(vectors), batch_size):
            index.upsert(vectors=vectors[i:i + batch_size])

        return True

    except Exception as e:
        raise Exception(f"Error storing vectors in Pinecone: {str(e)}")


# -------------------------------------------------------------------
# Vector Deletion
# -------------------------------------------------------------------

def delete_file_vectors(index_name: str, file_hash: str):
    """
    Delete all vectors related to a specific file from Pinecone.
    
    Args:
        index_name (str): Name of the Pinecone index.
        file_hash (str): Hash identifier of the file.
        
    Returns:
        int: Number of deleted vectors.
    """
    try:
        index = pinecone_service.Index(index_name)

        # Query for all vectors associated with this file hash
        query_response = index.query(
            vector=[0] * EMBEDDING_DIMENSION,  # Dummy query vector
            filter={"pc_file_hash": file_hash},
            top_k=10000,
            include_metadata=True
        )

        ids_to_delete = [match.id for match in query_response.matches]

        # Delete in manageable batches
        if ids_to_delete:
            batch_size = 1000
            for i in range(0, len(ids_to_delete), batch_size):
                index.delete(ids=ids_to_delete[i:i + batch_size])

        return len(ids_to_delete)

    except Exception as e:
        raise Exception(f"Error deleting file vectors: {str(e)}")


# -------------------------------------------------------------------
# Vector Search
# -------------------------------------------------------------------

def search_vectors(index_name: str, company_id: str, query_embedding: List[float] = [0] * EMBEDDING_DIMENSION, file_name: Optional[str] = None, extra_filter: Optional[dict] = None) -> Dict[str, Any]:
    """
    Search Pinecone index for similar vectors.
    
    Args:
        index_name (str): Name of Pinecone index.
        query_embedding (List[float]): Query embedding vector.
        company_id (str): Company ID to filter by.
        file_name (Optional[str]): Optional file filter.
        
    Returns:
        Dict[str, Any]: Search results containing metadata and similarity scores.
    """
    try:
        # Optional filtering (commented out but preserved)
        filter_dict = {}
        if file_name:
            filter_dict["pc_file_name"] = file_name
        if extra_filter:
            filter_dict = {
                **filter_dict,
                **extra_filter
            }

        print("HELLO -/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-/-")
        print(filter_dict)
        index = pinecone_service.Index(index_name)
        results = index.query(
            vector=query_embedding,
            top_k=100,
            filter=filter_dict,
            include_metadata=True,
            include_values=True
        )
        return results['matches']

    except Exception:
        return []


def find_defferent_features(product_vectors:list[dict]):
    common_keys = set(product_vectors[0]).intersection(*map(set, product_vectors[1:]))
    diff_values = {}
    for key in common_keys:
        values = {d[key] for d in product_vectors}  # all values for that key
        if len(values) > 1:               # only if values differ
            diff_values[key] = list(values)
    result = {}
    for i in diff_values.keys():
        if len(diff_values[i]) < len(product_vectors):
            result[i] = diff_values[i]
    
    return result


# -------------------------------------------------------------------
# Feature Extraction (LLM Analysis)
# -------------------------------------------------------------------

def extract_differentiating_features(retrieved_items: List[Dict], query:str) -> List[str]:
    """
    Use LLM to identify top differentiating product features.
    
    Example output:
        [
            {"length": ["1m", "2m"]},
            {"connector type": ["USB-C", "HDMI"]},
            {"material": ["copper", "aluminum"]}
        ]
    
    Args:
        retrieved_items (List[Dict]): List of Pinecone search results with metadata.
    
    Returns:
        List[str]: Extracted differentiating features in JSON structure.
    """
    for i in retrieved_items:
        print(i['score'])
    
    text_result = [item["metadata"]['pc_text'] for item in retrieved_items]
    
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
    # Serialize retrieved text data
    # Second LLM prompt: refine features to exclude those already mentioned in the query
    prompt_second = f"""
        You are given a dictionary of candidate product features and their possible values.
    Your task is to select the top 3–5 most important features that would be most helpful for a user to decide between products.

    Focus on features that:

    Strongly influence a user’s buying decision (e.g., technical specs, physical properties, or standards).

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

def search_vectors_product(index_name: str, query_text: str, company_id: str, conversationId:str, new_search:str, top_k: int = 5, file_name: Optional[str] = None):
    """
    Perform product search using embeddings, MMR diversification, 
    and LLM-based feature differentiation.
    
    Args:
        index_name (str): Pinecone index name.
        query_text (str): User query text.
        company_id (str): Company ID filter.
        top_k (int): Number of diverse top results.
        file_name (Optional[str]): Optional file name filter.
    
    Returns:
        Tuple[List[Dict], List[str]]:
            - diverse_results: Selected diverse product records
            - differentiating_features: Extracted distinguishing features
    """
    if new_search or vectors_for_each_conversation.get(conversationId, False) is False:
        # Step 1: Generate query embedding
        query_embedding = generate_embeddings([query_text])[0]
        features = query_text.split("|")
        defined_features = {}
        # for i in features:
        #     key_v = i.split(":")
        #     key = key_v[0].strip()
        #     value = i.split(f'{key}:')[-1].strip()
        #     defined_features[key] = value
        
        # Step 2: Retrieve top matches from Pinecone
        initial_results = search_vectors(index_name, company_id, query_embedding, file_name, defined_features)
        doc_vectors = [r['values'] for r in initial_results]
        
        for i in initial_results:
            print(i['score'])
        print("=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/")
        # Step 3: Apply MMR for diverse selection
        selected_indices = mmr(query_embedding, doc_vectors, lambda_param=0.7, top_k=top_k)
        vectors_for_each_conversation[conversationId] = [initial_results[i] for i in selected_indices]

    search_vector_result = vectors_for_each_conversation[conversationId]
    # Step 4: Extract differentiating features
    differentiating_features = extract_differentiating_features(search_vector_result, query_text)

    return search_vector_result, differentiating_features
