import io
import os
import uuid
import numpy as np
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel
from src.service_client import pinecone_service
from pinecone import ServerlessSpec

# -------------------------------------------------------------------
# Configuration
# -------------------------------------------------------------------
MODEL_NAME = "openai/clip-vit-base-patch32"
PINECONE_METRIC = "cosine"
SPEC = ServerlessSpec(cloud="aws", region="us-east-1")


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
    Create a Pinecone index if it doesn't exist.
    """
    if not pinecone_service.has_index(index_name):
        pinecone_service.create_index(
            name=index_name,
            dimension=embedding_dimension,
            metric=PINECONE_METRIC,
            spec=SPEC,
        )


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
) -> None:
    """Embed a single image (BytesIO) and store its vector in Pinecone."""
    try:
        emb = embedder.encode_image_bytes(image_bytes)
        dim = emb.shape[0]

        if index_name not in pinecone_service.list_indexes():
            create_index(index_name=index_name, embedding_dimension=dim)

        index = pinecone_service.Index(index_name)
        _ = delete_image_embedding(index_name, file_hash)

        metadata = {
            "pc_file_name": file_name,
            "pc_file_hash": file_hash,
            "pc_file_type": "IMAGE",
            "pc_file_extension": os.path.splitext(file_name)[1].lower(),
            "match_field": match_field
        }
        
        vector_id = str(uuid.uuid4())
        index.upsert(vectors=[(vector_id, emb.tolist(), metadata)])
        return True
    except:
        return False


# -------------------------------------------------------------------
# 2. SEARCH SIMILAR IMAGES
# -------------------------------------------------------------------
def search_similar_images(
    query_image_bytes: io.BytesIO,
    index_name: str,
    k: int = 5,
):
    """Find visually similar images for a query image (BytesIO)."""
    query_emb = embedder.encode_image_bytes(query_image_bytes)
    index = pinecone_service.Index(index_name)

    result = index.query(vector=query_emb.tolist(), top_k=k, include_metadata=True)
    matches = result.get("matches", [])

    if matches:
        print("\n[results] Similar Images:")
        for m in matches:
            print(f"ID={m['id']}  Score={m['score']:.4f}  Metadata={m.get('metadata', {})}")

    return matches


# -------------------------------------------------------------------
# 3. DELETE IMAGE EMBEDDING
# -------------------------------------------------------------------
def delete_image_embedding(index_name: str, file_hash: str) -> int:
    """Delete all vectors related to a specific file hash from Pinecone."""
    try:
        index = pinecone_service.Index(index_name)
        query_response = index.query(
            vector=[0.0] * 512,  # Dummy vector for filtering
            filter={"pc_file_hash": file_hash},
            top_k=10000,
            include_metadata=True,
        )
        ids_to_delete = [match.id for match in query_response.matches]

        for i in range(0, len(ids_to_delete), 1000):
            index.delete(ids=ids_to_delete[i : i + 1000])

        return len(ids_to_delete)

    except Exception as e:
        raise RuntimeError(f"Error deleting file vectors: {e}")
