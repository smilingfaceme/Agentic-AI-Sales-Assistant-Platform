import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from src.utils.pinecone_utills import create_index, store_vectors_in_pinecone, delete_file_vectors, search_vectors
from src.utils.embedding_utills import generate_embeddings
from src.utils.file_utills import generate_file_hash
from src.utils.splitter import chunk_file
from src.loaders.xlsx_loader import load_xlsx_file
from src.loaders.csv_loader import load_csv_file
import os, io
import tiktoken

# Constants
MAX_CHUNK_SIZE = 8000  # OpenAI embedding limit
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSION = 1536
MAX_TOKENS_PER_REQUEST=300000
def split_texts_into_batches(chunks, max_tokens=MAX_TOKENS_PER_REQUEST, model=EMBEDDING_MODEL):
    """
    Split a list of texts into batches such that total tokens per batch is under the limit.
    """
    enc = tiktoken.encoding_for_model(model)
    batches_chuncks, batches, current_batch_chunks, current_batch, current_tokens = [], [], [], [], 0

    for i, chunck in enumerate(chunks):
        tokens = len(enc.encode(chunck['text']))
        if tokens > max_tokens:
            raise Exception(f"Single text too large ({tokens} tokens) exceeds limit {max_tokens}")

        # If adding this text exceeds limit, start a new batch
        if current_tokens + tokens > max_tokens:
            batches.append(current_batch)
            batches_chuncks.append(current_batch_chunks)
            current_batch_chunks, current_batch, current_tokens = [], [], 0

        current_batch.append(chunck['text'])
        current_batch_chunks.append(chunck)
        current_tokens += tokens

    if current_batch:
        batches.append(current_batch)
        batches_chuncks.append(current_batch_chunks)

    return batches_chuncks, batches

def vectorize_file(file_content: io.BytesIO, file_name: str, index_name: str, company_id: str) -> Dict[str, Any]:
    """
    Main function to vectorize a CSV/XLSX file and store in Pinecone
    
    Args:
        file_path: Path to the CSV or XLSX file
        index_name: Name of Pinecone index
        company_id: Company ID for metadata
        
    Returns:
        Dictionary with processing results
    """
    # try:
    # Check file size
    # file_size = os.path.getsize(file_content)
    # max_file_size = 50 * 1024 * 1024  # 50MB limit
    
    # if file_size > max_file_size:
    #     raise Exception(f"File size ({file_size} bytes) exceeds maximum allowed size ({max_file_size} bytes)")
    print("Start Vectorizing File")
    # Create index if needed
    create_index(index_name)
    
    # Generate file hash for tracking
    file_hash = generate_file_hash(file_content.read())
    
    # Delete existing vectors for this file (if updating)
    deleted_count = delete_file_vectors(index_name, file_hash)
    
    # Validate file type and chunk the file
    file_extension = os.path.splitext(file_name)[1].lower()
    if file_extension in ['.xlsx', '.xls']:
        chunks = load_xlsx_file(file_content, file_name, file_hash)
    elif file_extension in ['.csv']:
        chunks = load_csv_file(file_content, file_name, file_hash)
    else:
        raise Exception(f"Unsupported file type: {file_extension}. Only CSV and Excel files are supported.")
    
    if not chunks:
        raise Exception("No chunks generated from file")
    
    print("Chunks generated from file", len(chunks))
    
    # texts = [chunk['text'] for chunk in chunks]
    # embedding = generate_embeddings(texts)
    # print("Embedding generated", len(embedding))
    
    # texts = [chunk['text'] for chunk in chunks]

    # Split texts into batches under token limit
    batches_chuncks, batches = split_texts_into_batches(chunks)
    
    print("-------> Start Generating Embeddings and stor: ", len(batches))
    all_embeddings = []
    for i, batch in enumerate(batches):
        print("-------> Generating Embeddings: ", i)
        embeddings = generate_embeddings(batch)  # your function calling OpenAI
        store_vectors_in_pinecone(index_name, batches_chuncks[i], embeddings)
        all_embeddings.extend(embeddings)
    # Add company_id to metadata
    # for chunk in chunks:
    #     chunk["metadata"]["company_id"] = company_id
    # print("-------> Start Generating Embeddings and stor: ", len(chunks))
    # # Generate embeddings
    # for i, chunk in enumerate(chunks):
    #     print("-------> Generating Embeddings: ", i)
    #     text = chunk['text']
    #     print(type(text))
        
    #     print(type(embedding))
    #     # Store vectors in Pinecone
    #     
    #     print("-------> Stored chunk: ", i)    
    # print("-------> End Generating Embeddings and storing in Pinecone: ", len(chunks)) 
    print("Finished")  
    return {
        "status": "success",
        "file_name": file_name,
        "file_hash": file_hash,
        "file_type": chunks[0]["metadata"]["pc_file_type"] if chunks else "unknown",
        "total_chunks": len(chunks),
        "total_rows": chunks[0]["metadata"]["pc_total_rows"] if chunks else 0,
        "deleted_previous_vectors": deleted_count,
        "message": f"Successfully vectorized {len(chunks)} chunks from {chunks[0]['metadata']['pc_file_type']} file"
    }