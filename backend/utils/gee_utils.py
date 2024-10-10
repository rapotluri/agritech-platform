import ee
import os
import json

def initialize_gee():
    """
    Initialize the Google Earth Engine API using service account credentials
    stored in an environment variable.
    """
    # Read the service account credentials from the environment variable
    service_account = "accurate-596@accurate-436800.iam.gserviceaccount.com"
    
    # Fetch the credentials JSON from the environment variable
    credentials_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")

    if not credentials_json:
        raise RuntimeError("Google Earth Engine credentials not found in environment variables.")

    # Parse the credentials from the JSON string
    credentials_dict = json.loads(credentials_json)

    # Create credentials object using the parsed credentials
    credentials = ee.ServiceAccountCredentials(service_account, credentials_dict)
    ee.Initialize(credentials)
