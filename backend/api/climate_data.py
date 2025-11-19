from uuid import uuid4
import time
from datetime import datetime, timedelta
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
        
        # Validate districts if provided
        if request.districts:
            # Normalize district names for comparison (remove spaces, similar to province normalization)
            available_districts = province_gdf["NAME_2"].unique().tolist()
            available_districts_normalized = {d.replace(" ", ""): d for d in available_districts}
            
            # Check each requested district
            invalid_districts = []
            normalized_request_districts = []
            for d in request.districts:
                normalized_d = d.replace(" ", "")
                if normalized_d in available_districts_normalized:
                    # Use the actual GeoDataFrame name (might have spaces)
                    normalized_request_districts.append(available_districts_normalized[normalized_d])
                else:
                    invalid_districts.append(d)
            
            if invalid_districts:
                raise HTTPException(
                    status_code=404,
                    detail=f"Invalid districts for province {province}: {invalid_districts}. Available districts: {available_districts}"
                )
            
            # Update request.districts with normalized names for storage
            request.districts = normalized_request_districts
            
            # Validate communes if provided
            if request.communes:
                # Filter by districts first if provided
                district_filtered_gdf = province_gdf[province_gdf["NAME_2"].isin(normalized_request_districts)]
                available_communes = district_filtered_gdf["NAME_3"].unique().tolist()
                available_communes_normalized = {c.replace(" ", ""): c for c in available_communes}
                
                # Check each requested commune
                invalid_communes = []
                normalized_request_communes = []
                for c in request.communes:
                    normalized_c = c.replace(" ", "")
                    if normalized_c in available_communes_normalized:
                        normalized_request_communes.append(available_communes_normalized[normalized_c])
                    else:
                        invalid_communes.append(c)
                
                if invalid_communes:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Invalid communes for province {province}: {invalid_communes}. Available communes: {available_communes}"
                    )
                
                # Update request.communes with normalized names for storage
                request.communes = normalized_request_communes
        elif request.communes:
            # If communes provided but no districts, validate communes against all districts in province
            available_communes = province_gdf["NAME_3"].unique().tolist()
            available_communes_normalized = {c.replace(" ", ""): c for c in available_communes}
            
            # Check each requested commune
            invalid_communes = []
            normalized_request_communes = []
            for c in request.communes:
                normalized_c = c.replace(" ", "")
                if normalized_c in available_communes_normalized:
                    normalized_request_communes.append(available_communes_normalized[normalized_c])
                else:
                    invalid_communes.append(c)
            
            if invalid_communes:
                raise HTTPException(
                    status_code=404,
                    detail=f"Invalid communes for province {province}: {invalid_communes}. Available communes: {available_communes}"
                )
            
            # Update request.communes with normalized names for storage
            request.communes = normalized_request_communes
    
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
    
    # Add districts and communes if provided (store as empty array if None for consistency)
    if request.districts:
        download_record["districts"] = request.districts
    if request.communes:
        download_record["communes"] = request.communes
    
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

@router.post("/climate-data/cleanup")
async def cleanup_old_weather_files(
    current_user: dict = Depends(get_current_user)
):
    """
    Clean up weather data files older than 24 hours from Supabase storage.
    Deletes the files but keeps the database records.
    """
    supabase = get_supabase_client()
    
    # Calculate 24 hours ago
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    
    try:
        # Find all downloads older than 24 hours with file_url
        result = supabase.table("weather_downloads")\
            .select("*")\
            .not_.is_("file_url", "null")\
            .lt("created_at", twenty_four_hours_ago.isoformat())\
            .execute()
        
        if not result.data:
            return {
                "message": "No old files to clean up",
                "files_deleted": 0
            }
        
        files_deleted = 0
        files_failed = 0
        
        for download in result.data:
            try:
                # Reconstruct file path from download record
                # Format: {user_id}/{provinces_str}_{dataset_type}_data_{date_start}_{date_end}_{download_id}.xlsx
                user_id = download["requested_by_user_id"]
                provinces_str = "_".join(download["provinces"])
                dataset_type = download["dataset"]
                date_start = download["date_start"].replace('-', '')
                date_end = download["date_end"].replace('-', '')
                download_id = download["id"]
                
                filename = f"{provinces_str}_{dataset_type}_data_{date_start}_{date_end}_{download_id}.xlsx"
                file_path = f"{user_id}/{filename}"
                
                # Delete file from storage
                try:
                    storage_result = supabase.storage.from_("weather-data-downloads").remove([file_path])
                    
                    # Check if deletion was successful (Supabase returns a list of deleted file paths)
                    if storage_result and len(storage_result) > 0:
                        # Update record to remove file_url (set to null)
                        supabase.table("weather_downloads")\
                            .update({"file_url": None})\
                            .eq("id", download_id)\
                            .execute()
                        
                        files_deleted += 1
                        print(f"[INFO] Deleted file: {file_path}")
                    else:
                        # File might not exist, but that's okay - still update the record
                        supabase.table("weather_downloads")\
                            .update({"file_url": None})\
                            .eq("id", download_id)\
                            .execute()
                        
                        files_deleted += 1
                        print(f"[INFO] File not found (may have been deleted already): {file_path}, updated record")
                except Exception as storage_error:
                    # Even if file deletion fails, try to update the record
                    try:
                        supabase.table("weather_downloads")\
                            .update({"file_url": None})\
                            .eq("id", download_id)\
                            .execute()
                    except:
                        pass
                    
                    files_failed += 1
                    print(f"[WARNING] Failed to delete file {file_path}: {str(storage_error)}")
                    
            except Exception as e:
                files_failed += 1
                print(f"[ERROR] Error deleting file for download {download.get('id', 'unknown')}: {str(e)}")
        
        return {
            "message": f"Cleanup completed. {files_deleted} files deleted, {files_failed} failed.",
            "files_deleted": files_deleted,
            "files_failed": files_failed
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error during cleanup: {str(e)}"
        )
