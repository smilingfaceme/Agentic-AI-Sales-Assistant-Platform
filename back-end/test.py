from src.loaders.csv_loader import load_csv_xlsx_file

if __name__ == "__main__":
    file_path = "Sample_Data.xlsx"   # change this to your file path
    chunks = load_csv_xlsx_file(file_path)
    print(chunks[0])