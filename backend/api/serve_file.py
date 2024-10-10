from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os

# Set up the FastAPI router
router = APIRouter(
    prefix="/api",
    tags=["files"],
    responses={404: {"description": "Not found"}},
)

# Endpoint to serve the Excel file
@router.get("/download/{filename}", response_class=FileResponse)
async def download_file(filename: str):
    """
    Download the generated Excel file.
    Args:
    - filename: The name of the Excel file to download.
    """
    file_path = os.path.join("files", filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found.")
    
    return FileResponse(file_path, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename=filename)
