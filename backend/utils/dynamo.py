import os
from datetime import datetime
from typing import Dict, Any
from backend.utils.aws_config import dynamodb_client

TABLE_NAME = os.getenv('DYNAMODB_TABLE')

def get_table():
    """Get DynamoDB table instance"""
    if not TABLE_NAME:
        raise ValueError("DYNAMODB_TABLE environment variable not set")
    return dynamodb_client.Table(TABLE_NAME)

def store_task_result(task_id: str, file_url: str, metadata: Dict[str, Any]) -> None:
    """
    Store task result in DynamoDB
    """
    try:
        table = get_table()
        item = {
            'id': task_id,
            'created_at': datetime.now().isoformat(),
            'file_url': file_url,
            'status': 'completed',
            'metadata': metadata
        }
        table.put_item(Item=item)
    except Exception as e:
        print(f"Error storing task result in DynamoDB: {str(e)}")
        raise

def get_task_result(task_id: str) -> Dict[str, Any]:
    """
    Retrieve task result from DynamoDB
    """
    try:
        table = get_table()
        response = table.get_item(Key={'id': task_id})
        return response.get('Item')
    except Exception as e:
        print(f"Error retrieving task result from DynamoDB: {str(e)}")
        raise 