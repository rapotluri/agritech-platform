import ee
import os


def initialize_gee_local():
    """Initialize Google Earth Engine with the service account credentials."""
    # Check if GEE is already initialized (safe for all versions)
    if not getattr(ee.data, '_credentials', None):
        try:
            service_account = "accurate-596@accurate-436800.iam.gserviceaccount.com"
            credentials_file = os.path.join(os.getcwd(), "api", "g_credentials.json")
            credentials = ee.ServiceAccountCredentials(service_account, credentials_file)
            ee.Initialize(credentials)
        except Exception:
            # Already initialized, ignore
            pass
