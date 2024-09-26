from pymongo import MongoClient


def get_db_handle():
    client = MongoClient("mongodb://db:27017/")
    db_handle = client["SocialDB"]

    return db_handle, client
