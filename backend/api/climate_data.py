from uuid import uuid4
import time
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, Header
from countries import (
    get_geodataframe,
    validate_location as validate_country_location,
    get_all_provinces,
    get_districts_for_province,
    get_communes_for_district,
    province_to_filename,
)
from celery_worker import data_task
from utils.supabase_client import get_supabase_client
from utils.country_utils import country_for_db
from models.weather_download import (
    WeatherDownloadRequest, 
    WeatherDownloadStatus
)
import jwt
import os

router = APIRouter(
    prefix="/api",
    tags=["climate-data"],
    responses={404: {"description": "Not found"}},
)

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
        token = authorization.split(" ")[1]
        
        supabase_jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
        if not supabase_jwt_secret:
            raise HTTPException(
                status_code=500,
                detail="Supabase JWT secret not configured"
            )
        
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
    """
    country = request.country
    communes_gdf = get_geodataframe(country)

    for province in request.provinces:
        if not validate_country_location(country, province):
            available_provinces = get_all_provinces(country)
            raise HTTPException(
                status_code=404, 
                detail=f"Invalid province/state for {country}: {province}. Available options: {available_provinces}"
            )
        
        normalized_province = province_to_filename(country, province)
        province_gdf = communes_gdf[communes_gdf["normalized_NAME_1"] == normalized_province]
        if province_gdf.empty:
            raise HTTPException(
                status_code=404, 
                detail=f"No locations found for province/state: {province}"
            )
        
        if request.districts:
            invalid_districts = []
            for d in request.districts:
                if not validate_country_location(country, province, d):
                    invalid_districts.append(d)
            
            if invalid_districts:
                available_districts = get_districts_for_province(country, province)
                raise HTTPException(
                    status_code=404,
                    detail=f"Invalid districts for {province}: {invalid_districts}. Available districts: {available_districts}"
                )
            
            province_gdf = province_gdf[province_gdf["NAME_2"].isin(request.districts)]
            if province_gdf.empty:
                raise HTTPException(
                    status_code=404,
                    detail=f"No locations found for districts {request.districts} in {province}"
                )
            
            if request.communes:
                invalid_communes = []
                for c in request.communes:
                    commune_found = any(
                        validate_country_location(country, province, d, c)
                        for d in request.districts
                    )
                    if not commune_found:
                        invalid_communes.append(c)
                
                if invalid_communes:
                    available_communes = []
                    for d in request.districts:
                        available_communes.extend(get_communes_for_district(country, province, d))
                    raise HTTPException(
                        status_code=404,
                        detail=f"Invalid communes for {province} and districts {request.districts}: {invalid_communes}. Available communes: {available_communes}"
                    )
                
                province_gdf = province_gdf[province_gdf["NAME_3"].isin(request.communes)]
                if province_gdf.empty:
                    raise HTTPException(
                        status_code=404,
                        detail=f"No communes found for specified communes {request.communes} in {province}"
                    )
        elif request.communes:
            invalid_communes = []
            for c in request.communes:
                commune_found = False
                districts = get_districts_for_province(country, province)
                for d in districts:
                    if validate_country_location(country, province, d, c):
                        commune_found = True
                        break
                if not commune_found:
                    invalid_communes.append(c)
            
            if invalid_communes:
                available_communes = []
                districts = get_districts_for_province(country, province)
                for d in districts:
                    available_communes.extend(get_communes_for_district(country, province, d))
                raise HTTPException(
                    status_code=404,
                    detail=f"Invalid communes for {province}: {invalid_communes}. Available communes: {available_communes}"
                )
            
            province_gdf = province_gdf[province_gdf["NAME_3"].isin(request.communes)]
            if province_gdf.empty:
                raise HTTPException(
                    status_code=404,
                    detail=f"No communes found for specified communes {request.communes} in {province}"
                )
    
    supabase = get_supabase_client()
    download_record = {
        "requested_by_user_id": current_user["id"],
        "country": country_for_db(request.country),
        "dataset": request.dataset.value,
        "provinces": request.provinces,
        "date_start": request.date_start.isoformat(),
        "date_end": request.date_end.isoformat(),
        "status": WeatherDownloadStatus.QUEUED.value
    }
    
    if request.districts:
        download_record["districts"] = request.districts
    if request.communes:
        download_record["communes"] = request.communes
    
    result = supabase.table("weather_downloads").insert(download_record).execute()
    download_id = result.data[0]["id"]
    
    task = data_task.delay(download_id)
    
    return {
        "download_id": download_id,
        "status": "queued",
        "message": f"{request.dataset.value.capitalize()} data retrieval has been initiated."
    }

@router.get("/climate-data")
async def get_climate_data_legacy(
    province: str, start_date: str, end_date: str, data_type: str,
    current_user: dict = Depends(get_current_user)
):
    """
    DEPRECATED: Legacy endpoint for backward compatibility.
    Use POST /api/climate-data instead.
    """
    from datetime import datetime
    
    try:
        start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        request = WeatherDownloadRequest(
            dataset=data_type.lower(),
            provinces=[province],
            date_start=start_date_obj,
            date_end=end_date_obj
        )
        
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
    
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    
    try:
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
                user_id = download["requested_by_user_id"]
                provinces_str = "_".join(download["provinces"])
                dataset_type = download["dataset"]
                date_start = download["date_start"].replace('-', '')
                date_end = download["date_end"].replace('-', '')
                download_id = download["id"]
                
                filename = f"{provinces_str}_{dataset_type}_data_{date_start}_{date_end}_{download_id}.xlsx"
                file_path = f"{user_id}/{filename}"
                
                try:
                    storage_result = supabase.storage.from_("weather-data-downloads").remove([file_path])
                    
                    if storage_result and len(storage_result) > 0:
                        supabase.table("weather_downloads")\
                            .update({"file_url": None})\
                            .eq("id", download_id)\
                            .execute()
                        
                        files_deleted += 1
                        print(f"[INFO] Deleted file: {file_path}")
                    else:
                        supabase.table("weather_downloads")\
                            .update({"file_url": None})\
                            .eq("id", download_id)\
                            .execute()
                        
                        files_deleted += 1
                        print(f"[INFO] File not found (may have been deleted already): {file_path}, updated record")
                except Exception as storage_error:
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
