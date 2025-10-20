import pandas as pd
from src.utils.file_utills import dataframe_to_texts
from src.utils.splitter import chunk_file
import os, io

def load_csv_file(file_content: io.BytesIO, file_name:str, file_hash:str) -> list[str]:
    """
    Load a CSV file and convert it into a list of row-based text strings.

    Args:
        file_content (io.BytesIO): Content of the CSV file.
        file_name (str): Name of the CSV file.
        file_hash (str): Hash of the CSV file.

    Returns:
        list[str]: List of row-based text strings.
    """
    
    # Get file info
    file_extension = os.path.splitext(file_name)[1].lower()
    file_type = 'CSV'
    file_hash = file_hash
    
    metadata = {
        "pc_file_name": file_name,
        "pc_file_hash": file_hash,
        "pc_file_type": file_type,
        "pc_file_extension": file_extension
    }
    df = pd.read_csv(file_content)
    texts, meta_dict = dataframe_to_texts(df)
    
    return chunk_file(texts, meta_dict, max_chunk_size=8000, metadata=metadata)