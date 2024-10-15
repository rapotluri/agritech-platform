from io import BytesIO
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from celery.result import AsyncResult
from utils.mongo import get_mongodb_fs
from bson import ObjectId
from celery_worker import celery_app

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
    task_result = AsyncResult(task_id, app=celery_app)

    if task_result.state == "SUCCESS":
        fs = get_mongodb_fs()
        file_id = task_result.result
        file_data = fs.get(ObjectId(file_id))

        if not file_data:
            raise HTTPException(status_code=404, detail="File not found")

        # Create a BytesIO stream from the file content
        file_stream = file_data.read()

        # Create a temporary file to store the GridFS data
        temp_file_path = os.path.join(os.getcwd(), "files", f"{file_data.filename}")

        # Write the data from GridFS into the temporary file
        with open(temp_file_path, "wb") as temp_file:
            temp_file.write(file_stream)

        # Return the file response with appropriate media type and filename
        return FileResponse(
            temp_file_path,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename=file_data.filename,  # Get filename from GridFS
        )
    else:
        raise HTTPException(status_code=400, detail="Task is not completed yet")
