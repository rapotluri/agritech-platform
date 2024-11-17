import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

def get_env_variable(name: str, default: str = None) -> str:
    """Get environment variable or return default value"""
    value = os.getenv(name, default)
    if value is None:
        raise ValueError(f"Environment variable {name} not set")
    return value

# AWS Configuration
AWS_ACCESS_KEY_ID = get_env_variable("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = get_env_variable("AWS_SECRET_ACCESS_KEY")
AWS_REGION = get_env_variable("AWS_REGION", "ap-southeast-1")

# Redis Configuration
REDIS_HOST = get_env_variable("REDIS_HOST")
REDIS_PORT = get_env_variable("REDIS_PORT", "6379")

# S3 Configuration
S3_BUCKET = get_env_variable("S3_BUCKET", "accurate-climate-data")

# DynamoDB Configuration
DYNAMODB_TABLE = get_env_variable("DYNAMODB_TABLE", "ClimateData")

# Google Earth Engine Configuration
GEE_SERVICE_ACCOUNT = get_env_variable("GEE_SERVICE_ACCOUNT", "accurate@accurate-402305.iam.gserviceaccount.com")
GEE_PRIVATE_KEY = get_env_variable("GEE_PRIVATE_KEY", "")

# Directories
BOUNDARIES_DIR = os.path.join(os.getcwd(), "boundaries")

# Premium Configuration
PREMIUM_BASE_RATE = 0.05
PREMIUM_MULTIPLIER = 1.5

# Dataset IDs
CHIRPS_PRECIPITATION_DATASET = "UCSB-CHG/CHIRPS/DAILY"
ERA5_TEMPERATURE_DATASET = "ECMWF/ERA5_LAND/DAILY_AGGR" 