import boto3
from botocore.config import Config
from backend.utils.config import AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

# AWS Configuration
AWS_CONFIG = Config(
    region_name=AWS_REGION,
    retries=dict(max_attempts=3)
)

# Initialize AWS clients
s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    config=AWS_CONFIG
)

dynamodb_client = boto3.resource(
    'dynamodb',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    config=AWS_CONFIG
) 