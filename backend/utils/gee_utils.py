import ee
import os
import json
import tempfile

def initialize_gee():
    """
    Initialize the Google Earth Engine API using service account credentials
    stored in a Render secret file.
    """
    service_account = "accurate-596@accurate-436800.iam.gserviceaccount.com"
    
    credentials_str = os.getenv("GOOGLE_CREDENTIALS")
    fixed_str = (
        credentials_str
        .replace("{", '{"')             # Add opening quotes for keys
        .replace("}", '"}')             # Add closing quotes for keys
        .replace(":", '": "')           # Add quotes around keys and values
        .replace(",", '", "')           # Add quotes around pairs
        .replace('", "}', '"}')         # Remove trailing comma properly
    )

    credentials_dict = json.loads(fixed_str)
    # Create a temporary file to store the JSON credentials
    with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as temp_file:
        temp_file.write(json.dumps(credentials_dict).encode('utf-8'))
        temp_file_path = temp_file.name  # Get the path to the temp file

    # Initialize Earth Engine using the temporary credentials file path
    credentials = ee.ServiceAccountCredentials(service_account, temp_file_path)
    ee.Initialize(credentials)

    # Remove the temporary file after initialization
    os.remove(temp_file_path)
