from io import BytesIO
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from celery.result import AsyncResult
import os

from utils.mongo import get_mongodb_fs

# Set up the FastAPI router
router = APIRouter(
    prefix="/api",
    tags=["files"],
    responses={404: {"description": "Not found"}},
)


# Endpoint to serve the Excel file
@router.get("/file", response_class=FileResponse)
async def download_file(task_id: str):
    """
    Download the generated Excel file.
    Args:
    - filename: The name of the Excel file to download.
    """
    task_result = AsyncResult(task_id)

    if task_result.state == "SUCCESS":
        fs = get_mongodb_fs()
        file_data = fs.get(task_result.result)

        if not file_data:
            raise HTTPException(status_code=404, detail="File not found")

        # Create a BytesIO stream from the file content
        file_stream = BytesIO(
            file_data.read()
        )  # Read file content into a BytesIO stream
        file_stream.seek(0)  # Rewind the stream to the beginning

        # Return the file as a FileResponse
        return FileResponse(
            file_data,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename=file_data.filename,
        )
    else:
        raise HTTPException(status_code=400, detail="Task is not completed yet")
