import ee
import os

def initialize_gee():
    """Initialize Google Earth Engine with the service account credentials."""
    if not ee.data._credentials:
        service_account = "accurate-596@accurate-436800.iam.gserviceaccount.com"
        credentials_file = os.path.join(os.getcwd(), "api", "accurate-436800-7ed6a0dbbaf7.json")
        credentials = ee.ServiceAccountCredentials(service_account, credentials_file)
        ee.Initialize(credentials)