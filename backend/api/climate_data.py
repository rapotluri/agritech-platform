from uuid import uuid4
import time
from fastapi import APIRouter, HTTPException, Depends
from countries.cambodia import get_communes_geodataframe
from celery_worker import data_task
from utils.supabase_client import get_supabase_client
from models.weather_download import (
    WeatherDownloadRequest, 
    WeatherDownloadStatus
)

# Set up the FastAPI router
router = APIRouter(
    prefix="/api",
    tags=["climate-data"],
    responses={404: {"description": "Not found"}},
)

# Load GeoDataFrame with communes
communes_gdf = get_communes_geodataframe()

# Temporary user dependency - replace with proper auth when available
async def get_current_user():
    """
    Temporary user dependency for development.
    Replace with proper authentication when available.
    """
    # For now, return a mock user ID
    # In production, this should extract user from JWT token or session
    return {"id": "00000000-0000-0000-0000-000000000000"}

@router.post("/climate-data")
async def submit_climate_data_request(
    request: WeatherDownloadRequest, 
    current_user: dict = Depends(get_current_user)
):
    """
    Submit a new weather data download request.
    Creates a database record and starts a Celery task.
    Only endpoint needed - all reads handled by frontend directly.
    """
    # Validate provinces exist in the dataset
    for province in request.provinces:
        province_gdf = communes_gdf[communes_gdf["normalized_NAME_1"] == province]
        if province_gdf.empty:
            raise HTTPException(
                status_code=404, 
                detail=f"No communes found for province: {province}"
            )
    
    # Create database record
    supabase = get_supabase_client()
    download_record = {
        "requested_by_user_id": current_user["id"],
        "dataset": request.dataset.value,
        "provinces": request.provinces,
        "date_start": request.date_start.isoformat(),
        "date_end": request.date_end.isoformat(),
        "status": WeatherDownloadStatus.QUEUED.value
    }
    
    result = supabase.table("weather_downloads").insert(download_record).execute()
    download_id = result.data[0]["id"]
    
    # Start Celery task with download_id
    task = data_task.delay(download_id)
    
    return {
        "download_id": download_id,
        "status": "queued",
        "message": f"{request.dataset.value.capitalize()} data retrieval has been initiated."
    }

# Keep the old GET endpoint for backward compatibility (deprecated)
@router.get("/climate-data")
async def get_climate_data_legacy(
    province: str, start_date: str, end_date: str, data_type: str,
    current_user: dict = Depends(get_current_user)
):
    """
    DEPRECATED: Legacy endpoint for backward compatibility.
    Use POST /api/climate-data instead.
    """
    # Convert to new format and call the new endpoint
    # This maintains backward compatibility during migration
    from datetime import datetime
    
    try:
        # Parse dates
        start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        # Create request object
        request = WeatherDownloadRequest(
            dataset=data_type.lower(),
            provinces=[province],
            date_start=start_date_obj,
            date_end=end_date_obj
        )
        
        # Call the new endpoint with the current user
        return await submit_climate_data_request(request, current_user)
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format or data type: {str(e)}"
        )
