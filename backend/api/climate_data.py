from uuid import uuid4
import time
from fastapi import APIRouter, HTTPException, Depends, Header
from countries.cambodia import get_communes_geodataframe
from celery_worker import data_task
from utils.supabase_client import get_supabase_client
from models.weather_download import (
    WeatherDownloadRequest, 
    WeatherDownloadStatus
)
import jwt
import os

# Set up the FastAPI router
router = APIRouter(
    prefix="/api",
    tags=["climate-data"],
    responses={404: {"description": "Not found"}},
)

# Load GeoDataFrame with communes
communes_gdf = get_communes_geodataframe()

async def get_current_user(authorization: str = Header(None)):
    """
    Extract user ID from Supabase JWT token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid authorization header"
        )
    
    try:
        # Extract token from "Bearer <token>"
        token = authorization.split(" ")[1]
        
        # Get Supabase JWT secret from environment
        supabase_jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
        if not supabase_jwt_secret:
            raise HTTPException(
                status_code=500,
                detail="Supabase JWT secret not configured"
            )
        
        # Decode the JWT token
        payload = jwt.decode(
            token, 
            supabase_jwt_secret, 
            algorithms=["HS256"],
            audience="authenticated"
        )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token: missing user ID"
            )
        
        return {"id": user_id}
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Authentication error: {str(e)}"
        )

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
