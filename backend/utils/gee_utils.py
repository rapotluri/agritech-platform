import ee
import os
import json

def initialize_gee():
    """
    Initialize the Google Earth Engine API using service account credentials
    stored in a Render secret file.
    """
    service_account = "accurate-596@accurate-436800.iam.gserviceaccount.com"
    
    # Define the path to the secret file (as defined in Render)
    credentials_file = "/etc/secrets/g_credentials.json"

    # Check if the credentials file exists
    if not os.path.isfile(credentials_file):
        raise RuntimeError(f"Google Earth Engine credentials file not found at {credentials_file}")

    # Read the JSON content from the file
    with open(credentials_file, 'r') as file:
        credentials_dict = json.load(file)

    # Create credentials object using the parsed credentials
    credentials = ee.ServiceAccountCredentials(service_account, credentials_dict)
    ee.Initialize(credentials)
