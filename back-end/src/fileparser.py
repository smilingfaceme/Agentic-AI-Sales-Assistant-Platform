import pandas as pd
import hashlib
import os

def parse_csv_xlsx_file(file_path: str) -> pd.DataFrame:
    """
    Parse a CSV or XLSX file into a pandas DataFrame.

    Args:
        file_path (str): Path to the input file (CSV or XLSX).

    Returns:
        pd.DataFrame: Loaded DataFrame.

    Raises:
        ValueError: If file extension is not supported.
        FileNotFoundError: If the file does not exist.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".csv":
        df = pd.read_csv(file_path)
    elif ext in [".xlsx", ".xls"]:
        df = pd.read_excel(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}. Only CSV and XLSX are supported.")

    return df

def generate_file_hash(file_content: bytes) -> str:
    """Generate unique hash for file content"""
    return hashlib.md5(file_content).hexdigest()


# Example usage
if __name__ == "__main__":
    file_path = "Sample_Data.xlsx"   # change this to your file path
    df = parse_csv_xlsx_file(file_path)
    print(df.head())
    
    print(generate_file_hash(open(file_path, 'rb').read()))
