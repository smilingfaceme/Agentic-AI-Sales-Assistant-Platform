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
                key = col.strip("'")
                meta_key = col.strip("'").replace(" ", "_").replace("-", "_").replace("/", "_").replace("(", "_").replace(")", "_").replace(".", "_").lower()
                row_values.append(f"{key}: {str(val)}")
                if type(val) == int or type(val) == float:
                    result[meta_key] = val
                else:
                    result[meta_key] = f'{val}'.lower()
        row_text = " | ".join(row_values)
        texts.append(row_text)
        meta_dict.append(result)
    return texts, meta_dict


def dataframe_to_texts_with_columns(df: pd.DataFrame) -> list[str]:
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
    filtered_columns = {}

    for col in df.columns:
        non_null_series = df[col].dropna()
        unique_values = non_null_series.drop_duplicates()
        
        num_non_null = len(non_null_series)
        num_unique = len(unique_values)
        
        # Include column if number of unique values < half of non-null count
        if num_unique < 0.5 * num_non_null:
            filtered_columns[col] = unique_values.tolist()
    
    for i, (col, values) in enumerate(filtered_columns.items()):
        for y, val in enumerate(values):
            
            meta_key = col.strip("'").replace(" ", "_").replace("-", "_").replace("/", "_").replace("(", "_").replace(")", "_").replace(".", "_").lower()
            texts.append(f"{meta_key}: {str(val).lower()}")
            result = {"column_name": meta_key, "column_value": f'{val}'.lower()}
            meta_dict.append(result)
    
    return texts, meta_dict