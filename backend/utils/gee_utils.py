import os
import ee
import json
import tempfile
from datetime import datetime
from backend.utils.config import GEE_SERVICE_ACCOUNT, GEE_PRIVATE_KEY

def initialize_gee():
    """
    Initialize the Google Earth Engine API using service account credentials
    stored in a Render secret file.
    """
    service_account = GEE_SERVICE_ACCOUNT
    
    # Define the path to the secret file (as defined in Render)
    #credentials_file = "/etc/secrets/g_credentials.json"

    #Local
    credentials_file = os.path.join(os.getcwd(), "api", "g_credentials.json")

    # Check if the credentials file exists
    if not os.path.isfile(credentials_file):
        raise RuntimeError(f"Google Earth Engine credentials file not found at {credentials_file}")

    # Read the JSON content from the file
    with open(credentials_file, 'r') as file:
        credentials_dict = json.load(file)

    # Create a temporary file to store the JSON credentials
    with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as temp_file:
        temp_file.write(json.dumps(credentials_dict).encode('utf-8'))
        temp_file_path = temp_file.name  # Get the path to the temp file

    # Initialize Earth Engine using the temporary credentials file path
    credentials = ee.ServiceAccountCredentials(service_account, temp_file_path)
    ee.Initialize(credentials)

    # Remove the temporary file after initialization
    os.remove(temp_file_path)

def get_date_range(start_date: str, end_date: str):
    """Convert date strings to ee.Date objects"""
    start = ee.Date(start_date)
    end = ee.Date(end_date)
    return start, end

def get_feature_collection(geometry):
    """Convert geometry to ee.FeatureCollection"""
    return ee.FeatureCollection([ee.Feature(geometry)])
