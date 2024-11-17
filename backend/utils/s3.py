import os
from typing import BinaryIO
from datetime import datetime, timedelta
from backend.utils.aws_config import s3_client
from backend.utils.config import S3_BUCKET

def upload_file(file_content: BinaryIO, filename: str) -> str:
    """
    Upload a file to S3 and return its URL
    """
    try:
        # Generate a unique path including timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        file_key = f"climate_data/{timestamp}_{filename}"
        
        # Upload to S3
        s3_client.upload_fileobj(
            file_content,
            S3_BUCKET,
            file_key,
            ExtraArgs={'ContentType': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}
        )
        
        return file_key
    
    except Exception as e:
        print(f"Error uploading file to S3: {str(e)}")
        raise

def get_file_url(file_key: str) -> str:
    """
    Generate a presigned URL for a file in S3
    """
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET, 'Key': file_key},
            ExpiresIn=3600
        )
        return url
    except Exception as e:
        print(f"Error generating presigned URL: {str(e)}")
        raise

def get_file(file_key: str) -> BinaryIO:
    """
    Get a file from S3
    """
    try:
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=file_key)
        return response['Body']
    except Exception as e:
        print(f"Error retrieving file from S3: {str(e)}")
        raise 