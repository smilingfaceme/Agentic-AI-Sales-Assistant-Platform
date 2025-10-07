import uuid
from typing import List, Dict, Any


def chunk_file(
    input_texts: List[str],
    max_chunk_size: int,
    metadata: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Splits text rows into chunks, each under `max_chunk_size` characters.

    Args:
        input_texts: List of row strings from CSV/XLSX
        max_chunk_size: Maximum characters allowed per chunk
        metadata: File metadata containing keys like:
            file_name, file_extension, file_type, file_hash

    Returns:
        A list of dicts containing chunk text and metadata
    """
    chunks = []
    current_chunk, current_size = [], 0
    total_rows = len(input_texts)

    def make_chunk(chunk_rows: List[str], row_start: int, row_end: int, chunk_index: int) -> Dict[str, Any]:
        """Helper to create a chunk dictionary with metadata."""
        return {
            "text": "\n".join(chunk_rows),
            "metadata": {
                **metadata,
                "chunk_id": str(uuid.uuid4()),
                "chunk_index": chunk_index,
                "total_chunks": 0,  # will update later
                "row_start": row_start,
                "row_end": row_end,
                "total_rows": total_rows,
            }
        }

    row_start = 0
    for idx, row_text in enumerate(input_texts):
        row_size = len(row_text)

        # Truncate oversized row
        if row_size > max_chunk_size:
            row_text = row_text[: max_chunk_size - 3] + "..."
            row_size = max_chunk_size

        # If this row doesn't fit in the current chunk → save chunk
        if current_size + row_size > max_chunk_size and current_chunk:
            chunks.append(make_chunk(current_chunk, row_start, idx - 1, len(chunks)))
            current_chunk, current_size = [], 0
            row_start = idx

        current_chunk.append(row_text)
        current_size += row_size + 1  # +1 for newline

    # Final chunk
    if current_chunk:
        chunks.append(make_chunk(current_chunk, row_start, total_rows - 1, len(chunks)))

    # Update total_chunks
    total_chunks = len(chunks)
    for chunk in chunks:
        chunk["metadata"]["total_chunks"] = total_chunks

    return chunks
