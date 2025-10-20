import pandas as pd
from src.utils.file_utills import dataframe_to_texts
from src.utils.splitter import chunk_file
import os, io

def load_xlsx_file(file_content: io.BytesIO, file_name:str, file_hash:str) -> list[str]:
    """
    Load a Excel file and convert it into a list of row-based text strings.

    Args:
        file_content (io.BytesIO): Content of the Excel file.
        file_name (str): Name of the Excel file.
        file_hash (str): Hash of the Excel file.

    Returns:
        list[str]: List of row-based text strings.
    """
    
    # Get file info
    file_extension = os.path.splitext(file_name)[1].lower()
    file_type = 'Excel'
    file_hash = file_hash
    
    metadata = {
        "pc_file_name": file_name,
        "pc_file_hash": file_hash,
        "pc_file_type": file_type,
        "pc_file_extension": file_extension
    }
    df = pd.read_excel(file_content)
    texts, meta_dict = dataframe_to_texts(df)
    
    return chunk_file(texts, meta_dict, max_chunk_size=8000, metadata=metadata)