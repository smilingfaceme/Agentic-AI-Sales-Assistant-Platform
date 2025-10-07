import hashlib
import pandas as pd

def generate_file_hash(file_content: bytes) -> str:
    """Generate unique hash for file content"""
    return hashlib.md5(file_content).hexdigest()

def dataframe_to_texts(df: pd.DataFrame) -> list[str]:
    """
    Convert a DataFrame into a list of row-based text strings.

    Each row becomes a string in the format:
        column1: value1 | column2: value2 | ...

    Args:
        df (pd.DataFrame): Input DataFrame.

    Returns:
        list[str]: List of row-based text strings.
    """
    texts = []
    
    for _,row in df.iterrows():
        # Convert row to string representation
        row_text = " | ".join([f"{col}: {str(val)}" for col, val in row.items()])
        texts.append(row_text)
    return texts