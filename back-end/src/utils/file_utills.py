import hashlib
import pandas as pd
from PIL import Image
import io
import os

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


def validate_and_convert_image(file_content: bytes, original_filename: str, output_format: str = "JPEG") -> tuple[bytes, str]:
    """
    Validate uploaded image file and convert to supported format if needed.

    Supported formats: jpg, jpeg, png
    If the file is not in these formats, it will be converted to the specified output_format.

    Args:
        file_content (bytes): The uploaded file content as bytes
        original_filename (str): Original filename with extension
        output_format (str): Target format for conversion (default: "JPEG")
                           Options: "JPEG", "PNG"

    Returns:
        tuple[bytes, str]: (converted_file_content, new_filename)

    Raises:
        ValueError: If the file cannot be opened as an image
        Exception: If conversion fails
    """
    # Supported image extensions
    SUPPORTED_EXTENSIONS = {'.jpg', '.jpeg', '.png'}

    # Get file extension
    file_extension = os.path.splitext(original_filename)[1].lower()

    try:
        # Open image from bytes
        image = Image.open(io.BytesIO(file_content))

        # Check if file is already in supported format
        if file_extension in SUPPORTED_EXTENSIONS:
            # File is already in supported format, return as-is
            return file_content, original_filename

        # File needs conversion
        # Convert RGBA to RGB if necessary (for JPEG compatibility)
        if output_format.upper() == "JPEG" and image.mode in ('RGBA', 'LA', 'P'):
            # Create white background
            rgb_image = Image.new('RGB', image.size, (255, 255, 255))
            # Paste image on white background
            if image.mode == 'P':
                image = image.convert('RGBA')
            rgb_image.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
            image = rgb_image
        elif image.mode not in ('RGB', 'L'):
            # Convert to RGB for other cases
            image = image.convert('RGB')

        # Convert to bytes
        output_buffer = io.BytesIO()

        # Determine output format and extension
        if output_format.upper() == "PNG":
            image.save(output_buffer, format='PNG', optimize=True)
            new_extension = '.png'
        else:  # Default to JPEG
            image.save(output_buffer, format='JPEG', quality=95, optimize=True)
            new_extension = '.jpg'

        # Get converted bytes
        converted_content = output_buffer.getvalue()

        # Generate new filename
        base_name = os.path.splitext(original_filename)[0]
        new_filename = f"{base_name}{new_extension}"

        return converted_content, new_filename

    except Exception as e:
        raise ValueError(f"Failed to process image file '{original_filename}': {str(e)}")


def is_supported_image_format(filename: str) -> bool:
    """
    Check if the file extension is a supported image format.

    Args:
        filename (str): Filename to check

    Returns:
        bool: True if supported, False otherwise
    """
    SUPPORTED_EXTENSIONS = {'.jpg', '.jpeg', '.png'}
    file_extension = os.path.splitext(filename)[1].lower()
    return file_extension in SUPPORTED_EXTENSIONS