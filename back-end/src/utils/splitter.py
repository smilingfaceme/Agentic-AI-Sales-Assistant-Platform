import uuid
from typing import List, Dict, Any

def chunk_file(
    input_texts: List[str],
    meta_dict: List[Dict],
    max_chunk_size: int,
    metadata: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Splits each row into one or more chunks.
    - If a row is shorter than `max_chunk_size`, it becomes one chunk.
    - If a row exceeds `max_chunk_size`, it is split into multiple chunks.

    Args:
        input_texts: List of row strings from CSV/XLSX.
        max_chunk_size: Maximum characters allowed per chunk.
        metadata: File metadata (e.g., file_name, file_extension, file_type, file_hash).

    Returns:
        List of dicts, each containing text and metadata.
    """
    chunks = []
    total_rows = len(input_texts)

    def make_chunk(text: str, meta:dict, row_index: int, sub_index: int, total_subchunks: int) -> Dict[str, Any]:
        """Helper to create a chunk dictionary with metadata."""
        return {
            "text": text,
            "metadata": {
                **metadata,
                "pc_chunk_id": str(uuid.uuid4()),
                "pc_chunk_index": len(chunks),
                "pc_total_chunks": 0,  # updated later
                "pc_row_index": row_index,
                "pc_row_sub_index": sub_index,
                "pc_total_row_subchunks": total_subchunks,
                "pc_total_rows": total_rows,
                **meta
            }
        }

    # Process each row independently
    for row_index, row_text in enumerate(input_texts):
        if not row_text:
            continue

        row_length = len(row_text)

        # If row fits in one chunk
        if row_length <= max_chunk_size:
            chunks.append(make_chunk(row_text, meta_dict[row_index], row_index, 0, 1))
        else:
            # Split long row into multiple parts
            total_subchunks = (row_length + max_chunk_size - 1) // max_chunk_size
            for i in range(total_subchunks):
                start = i * max_chunk_size
                end = start + max_chunk_size
                part = row_text[start:end]
                chunks.append(make_chunk(part, meta_dict[row_index], row_index, i, total_subchunks))

    # Update total_chunks
    total_chunks = len(chunks)
    for chunk in chunks:
        chunk["metadata"]["pc_total_chunks"] = total_chunks

    return chunks
