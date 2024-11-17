from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from celery.result import AsyncResult
from backend.utils.dynamo import get_task_result
from celery_worker import celery_app
from backend.utils.s3 import get_file_url

router = APIRouter(
    prefix="/api",
    tags=["files"],
    responses={404: {"description": "Not found"}},
)

@router.get("/file")
async def download_file(task_id: str):
    """
    Get the download URL for the generated file
    """
    task_result = AsyncResult(task_id, app=celery_app)

    if task_result.state == "SUCCESS":
        # Get the file URL from DynamoDB
        result = get_task_result(task_id)
        if not result:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Redirect to the presigned S3 URL
        return RedirectResponse(url=get_file_url(result['file_url']))
    else:
        raise HTTPException(status_code=400, detail="Task is not completed yet")
