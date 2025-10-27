import io
import os
import uuid
import numpy as np
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel
from src.service_client import chroma_client

# -------------------------------------------------------------------
# Configuration
# -------------------------------------------------------------------
MODEL_NAME = "openai/clip-vit-base-patch32"


# -------------------------------------------------------------------
# Device utility
# -------------------------------------------------------------------
def get_device() -> str:
    """Return best available computation device."""
    return "cuda" if torch.cuda.is_available() else "cpu"


# -------------------------------------------------------------------
# Index Management
# -------------------------------------------------------------------
def create_index(index_name: str, embedding_dimension: int) -> None:
    """
    Create a ChromaDB collection if it doesn't exist.
    """
    try:
        chroma_client.get_or_create_collection(
            name=index_name,
            metadata={"hnsw:space": "cosine"}
        )
    except Exception as e:
        raise Exception(f"Error creating ChromaDB collection: {str(e)}")


# -------------------------------------------------------------------
# CLIP Embedder
# -------------------------------------------------------------------
class CLIPEmbedder:
    """Encapsulates CLIP model + preprocessing for efficient embedding."""

    _model_cache = None
    _processor_cache = None

    def __init__(self, model_name: str = MODEL_NAME):
        self.device = get_device()
        if CLIPEmbedder._model_cache is None:
            CLIPEmbedder._model_cache = CLIPModel.from_pretrained(model_name).to(self.device)
        if CLIPEmbedder._processor_cache is None:
            CLIPEmbedder._processor_cache = CLIPProcessor.from_pretrained(model_name, use_fast=False)
        self.model = CLIPEmbedder._model_cache
        self.processor = CLIPEmbedder._processor_cache
        self.model.eval()

    def encode_image_bytes(self, image_bytes: io.BytesIO) -> np.ndarray:
        """Encode an image (BytesIO) into a normalized CLIP embedding."""
        with torch.no_grad(), Image.open(image_bytes) as image:
            image = image.convert("RGB")
            inputs = self.processor(images=image, return_tensors="pt").to(self.device)
            features = self.model.get_image_features(**inputs)
            features = torch.nn.functional.normalize(features, p=2, dim=-1)
        return features.squeeze(0).cpu().numpy().astype(np.float32)


# Instantiate embedder once (cached model)
embedder = CLIPEmbedder()


# -------------------------------------------------------------------
# 1. STORE IMAGE EMBEDDING
# -------------------------------------------------------------------
def store_image_embedding(
    image_bytes: io.BytesIO,
    file_name: str,
    file_hash: str,
    index_name: str,
    match_field: str,
    full_path: str
) -> None:
    """Embed a single image (BytesIO) and store its vector in ChromaDB."""
    # try:
    emb = embedder.encode_image_bytes(image_bytes)
    dim = emb.shape[0]

    # Create collection if it doesn't exist
    create_index(index_name=index_name, embedding_dimension=dim)

    collection = chroma_client.get_or_create_collection(
        name=index_name,
        metadata={"hnsw:space": "cosine"}
    )

    # Delete existing vectors for this file hash
    _ = delete_image_embedding(index_name, file_hash)

    metadata = {
        "pc_file_name": file_name,
        "pc_file_hash": file_hash,
        "pc_file_type": "IMAGE",
        "pc_file_extension": os.path.splitext(file_name)[1].lower(),
        "match_field": match_field,
        "full_path": full_path
    }

    vector_id = str(uuid.uuid4())
    collection.add(
        ids=[vector_id],
        embeddings=[emb.tolist()],
        metadatas=[metadata],
        documents=[file_name]
    )
    return True
    # except Exception as e:
    #     print(f"Error storing image embedding: {str(e)}")
    #     return False


# -------------------------------------------------------------------
# 2. SEARCH SIMILAR IMAGES
# -------------------------------------------------------------------
def search_similar_images(
    query_image_bytes: io.BytesIO,
    index_name: str,
    k: int = 2,
):
    """Find visually similar images for a query image (BytesIO)."""
    try:
        query_emb = embedder.encode_image_bytes(query_image_bytes)
        collection = chroma_client.get_or_create_collection(name=index_name)

        result = collection.query(
            query_embeddings=[query_emb.tolist()],
            n_results=k,
            include=["embeddings", "metadatas", "documents", "distances"]
        )

        # Transform results to match Pinecone format
        matches = []
        if result["ids"] and len(result["ids"]) > 0:
            for i, id_ in enumerate(result["ids"][0]):
                distance = result["distances"][0][i]
                similarity_score = 1 - distance

                matches.append({
                    "id": id_,
                    "score": similarity_score,
                    "metadata": result["metadatas"][0][i]
                })

        if matches:
            print("\n[results] Similar Images:")
            for m in matches:
                print(f"ID={m['id']}  Score={m['score']:.4f}  Metadata={m.get('metadata', {})}")

        return matches
    except Exception as e:
        print(f"Error searching similar images: {str(e)}")
        return []


# -------------------------------------------------------------------
# 3. DELETE IMAGE EMBEDDING
# -------------------------------------------------------------------
def delete_image_embedding(index_name: str, file_hash: str) -> int:
    """Delete all vectors related to a specific file hash from ChromaDB."""
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
                collection.delete(ids=ids_to_delete[i : i + batch_size])

        return len(ids_to_delete)

    except Exception as e:
        raise RuntimeError(f"Error deleting file vectors: {e}")
