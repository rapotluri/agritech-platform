import gridfs
from pymongo import MongoClient
import os

# Connect to MongoDB (adjust the URI as per your setup)
client = MongoClient(
    "mongodb+srv://accur8prod:jlJXZWm6CFPKqPuS@cluster0.dwqe7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
)  # Replace with your MongoDB URI
db = client["file_storage_db"]  # Database name

# GridFS instance
fs = gridfs.GridFS(db)


def upload_file_to_mongodb(file_path):
    """
    Uploads a file to MongoDB using GridFS.

    Args:
    - file_path: Path to the file to be uploaded.

    Returns:
    - file_id: The ID of the uploaded file in MongoDB.
    """
    # Check if the file exists
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' not found.")
        return None

    # Open the file in binary mode and upload it to GridFS
    with open(file_path, "rb") as file_data:
        file_name = os.path.basename(file_path)
        file_id = fs.put(file_data, filename=file_name)
        print(f"File '{file_name}' uploaded successfully with ID: {file_id}")

    return file_id


def retrieve_file_from_mongodb(file_id, download_path):
    """
    Retrieves a file from MongoDB using GridFS and saves it locally.

    Args:
    - file_id: The ID of the file to be retrieved.
    - download_path: Path where the file should be saved.
    """
    try:
        file_data = fs.get(file_id)
        with open(download_path, "wb") as output_file:
            output_file.write(file_data.read())
        print(f"File saved to '{download_path}'.")
    except gridfs.errors.NoFile:
        print(f"Error: File with ID '{file_id}' not found.")


if __name__ == "__main__":
    # Path to the file to be uploaded
    file_path = (
        "./KampongSpeu_precipitation_data_7de229ff-ee4d-44d4-b0e4-b5404e9e22a6.xlsx"
    )

    # Upload the file to MongoDB
    file_id = upload_file_to_mongodb(file_path)

    # Example: Retrieve the file back from MongoDB
    if file_id:
        download_path = "./retrieved_file.xlsx"
        retrieve_file_from_mongodb(file_id, download_path)
