from pymongo import MongoClient
from gridfs import GridFS
import os


def get_mongodb_fs():
    """
    Get a MongoDB client instance.
    """
    client = MongoClient(os.getenv("MONGO_URI"))
    db = client["agri-tech"]
    fs = GridFS(db)  # C
    return fs
