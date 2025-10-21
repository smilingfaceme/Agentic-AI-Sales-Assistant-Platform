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
    meta_dict = []
    for _,row in df.iterrows():
        # Convert row to string representation
        row_values = []
        result = {}
        for col, val in row.items():
            if pd.notna(val):
                key = col.strip("'").upper()
                row_values.append(f"{key}: {str(val)}")
                result[key] = f'{val}'
        row_text = " | ".join(row_values)
        texts.append(row_text)
        meta_dict.append(result)
    return texts, meta_dict