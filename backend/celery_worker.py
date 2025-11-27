import os
import sys
import ee
import pandas as pd
from http.server import BaseHTTPRequestHandler, HTTPServer
from multiprocessing import Process
from celery import Celery
from celery.signals import worker_process_init
from services.premium_calculator import calculate_premium
from schemas.premium_schema import PremiumRequest
from utils.gee_utils import initialize_gee
from utils.gee_utils_local import initialize_gee_local
from weather.precipitation import retrieve_precipitation_data
from weather.temperature import retrieve_temperature_data
from countries.cambodia import (
    get_communes_geodataframe,
    validate_location,
    province_to_filename
)
from io import BytesIO
from dotenv import load_dotenv
from services.insure_smart_optimizer import optimize_insure_smart

# Add the backend directory to Python path for imports
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

load_dotenv()

# Import the new modules at the top level with error handling
try:
    from utils.supabase_client import get_supabase_client
    from models.weather_download import WeatherDownloadStatus
    print("[DEBUG] Successfully imported new modules at top level")
except ImportError as e:
    print(f"[WARNING] Failed to import new modules at top level: {e}")
    print(f"[DEBUG] This is expected if running old tasks, will import in task function")

# Initialize Celery
celery_app = Celery("tasks")
celery_app.config_from_object("celeryconfig")

# Load GeoDataFrame with communes
communes_gdf = get_communes_geodataframe()

# Create files directory if it doesn't exist
os.makedirs(os.path.join(os.getcwd(), "files"), exist_ok=True)

@worker_process_init.connect
def init_worker(**kwargs):
    print(f"[DEBUG] Worker process init triggered with kwargs: {kwargs}")
    print(f"[DEBUG] Current ENV: {os.getenv('ENV')}")
    
    # Ensure backend directory is in Python path for worker process
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
        print(f"[DEBUG] Added backend directory to Python path: {backend_dir}")
    
    # Change to backend directory
    os.chdir(backend_dir)
    print(f"[DEBUG] Changed working directory to: {backend_dir}")
    
    if os.getenv("ENV") == "LOCAL":
        print("[DEBUG] Initializing GEE with local credentials")
        initialize_gee_local()
    else:
        print("[DEBUG] Initializing GEE with production credentials")
        initialize_gee()
    
    print("[DEBUG] Worker initialization completed")

@celery_app.task(name="data_task", bind=True)
def data_task(self, download_id: str):
    """
    Enhanced Celery task for processing weather data downloads.
    
    Args:
        download_id (str): The UUID of the download record in Supabase
        
    Returns:
        dict: Task result with status and file information
    """
    # Log task execution for debugging
    import uuid
    import traceback
    task_id = str(uuid.uuid4())[:8]  # Generate a short task ID for logging
    print(f"[INFO] Starting data_task: {task_id} for download_id: {download_id}")
    
    # Debug information
    print(f"[DEBUG] Current working directory: {os.getcwd()}")
    print(f"[DEBUG] Python path: {sys.path[:3]}...")
    print(f"[DEBUG] Backend directory: {os.path.dirname(os.path.abspath(__file__))}")
    
    # Import additional modules needed for the task
    import tempfile
    import time
    
    # Use the top-level imports that were already loaded
    print("[DEBUG] Using top-level imports for Supabase client and models")
    supabase = get_supabase_client()
    
    try:
        # Get download record with validation
        print(f"[INFO] Fetching download record for ID: {download_id}")
        result = supabase.table("weather_downloads")\
            .select("*")\
            .eq("id", download_id)\
            .execute()
        
        if not result.data:
            raise Exception(f"Download record not found: {download_id}")
        
        download_record = result.data[0]
        print(f"[INFO] Processing {download_record['dataset']} data for provinces: {download_record['provinces']}")
        
        # Update status to running
        supabase.table("weather_downloads")\
            .update({"status": WeatherDownloadStatus.RUNNING.value})\
            .eq("id", download_id)\
            .execute()
        
        # Initialize GEE if needed
        print(f"[INFO] Initializing Google Earth Engine...")
        # Check if GEE is already initialized (safe for all versions)
        if not getattr(ee.data, '_credentials', None):
            try:
                if os.getenv("ENV") == "LOCAL":
                    initialize_gee_local()
                else:
                    initialize_gee()
            except Exception:
                # Already initialized, ignore
                pass
        print(f"[INFO] Google Earth Engine initialized successfully")
        
        # Process each province with progress tracking
        all_data = pd.DataFrame()
        total_provinces = len(download_record["provinces"])
        
        for i, province in enumerate(download_record["provinces"]):
            print(f"[INFO] Processing province {i+1}/{total_provinces}: {province}")
            
            # Validate province using canonical location data (e.g., "Banteay Meanchey")
            if not validate_location(province):
                from countries.cambodia import get_all_provinces
                available_provinces = get_all_provinces()
                raise Exception(
                    f"Invalid province: '{province}'. "
                    f"Province must be in canonical format (e.g., 'Banteay Meanchey'). "
                    f"Available provinces: {available_provinces}"
                )
            
            # Get province GeoDataFrame using normalized name for file lookup
            normalized_province = province_to_filename(province)
            province_gdf = communes_gdf[communes_gdf["normalized_NAME_1"] == normalized_province]
            if province_gdf.empty:
                raise Exception(f"Province not found in dataset: {province}")
            
            # Filter by districts if provided
            districts = download_record.get("districts")
            if districts:
                # Validate districts using canonical location data (e.g., "Mongkol Borei")
                for d in districts:
                    if not validate_location(province, d):
                        from countries.cambodia import get_districts_for_province
                        available_districts = get_districts_for_province(province)
                        raise Exception(
                            f"Invalid district: '{d}' in province '{province}'. "
                            f"District must be in canonical format. "
                            f"Available districts for {province}: {available_districts}"
                        )
                
                # Districts are stored with their canonical names (may have spaces)
                province_gdf = province_gdf[province_gdf["NAME_2"].isin(districts)]
                if province_gdf.empty:
                    raise Exception(f"No communes found for districts {districts} in province {province}")
                print(f"[INFO] Filtered to {len(districts)} district(s): {districts}")
            
            # Filter by communes if provided
            communes = download_record.get("communes")
            if communes:
                # Validate communes using canonical location data
                # If districts are provided, validate commune against those districts
                if districts:
                    for c in communes:
                        commune_found = False
                        for d in districts:
                            if validate_location(province, d, c):
                                commune_found = True
                                break
                        if not commune_found:
                            from countries.cambodia import get_communes_for_district
                            available_communes = []
                            for d in districts:
                                available_communes.extend(get_communes_for_district(province, d))
                            raise Exception(
                                f"Invalid commune: '{c}' in province '{province}', districts {districts}. "
                                f"Commune must be in canonical format. "
                                f"Available communes: {available_communes}"
                            )
                else:
                    # If no districts, check commune exists in any district of the province
                    for c in communes:
                        commune_found = False
                        from countries.cambodia import get_districts_for_province
                        all_districts = get_districts_for_province(province)
                        for d in all_districts:
                            if validate_location(province, d, c):
                                commune_found = True
                                break
                        if not commune_found:
                            from countries.cambodia import get_districts_for_province, get_communes_for_district
                            available_communes = []
                            all_districts = get_districts_for_province(province)
                            for d in all_districts:
                                available_communes.extend(get_communes_for_district(province, d))
                            raise Exception(
                                f"Invalid commune: '{c}' in province '{province}'. "
                                f"Commune must be in canonical format. "
                                f"Available communes: {available_communes}"
                            )
                
                # Communes are stored with their canonical names (may have spaces)
                province_gdf = province_gdf[province_gdf["NAME_3"].isin(communes)]
                if province_gdf.empty:
                    raise Exception(f"No communes found for specified communes {communes} in province {province}")
                print(f"[INFO] Filtered to {len(communes)} commune(s): {communes}")
            
            # Retrieve data based on dataset type
            start_time = time.time()
            if download_record["dataset"] == "precipitation":
                province_data = retrieve_precipitation_data(
                    province_gdf, 
                    download_record["date_start"], 
                    download_record["date_end"]
                )
            elif download_record["dataset"] == "temperature":
                province_data = retrieve_temperature_data(
                    province_gdf, 
                    download_record["date_start"], 
                    download_record["date_end"]
                )
            else:
                raise Exception(f"Unsupported dataset type: {download_record['dataset']}")
            
            processing_time = time.time() - start_time
            print(f"[INFO] Retrieved {len(province_data)} records for {province} in {processing_time:.2f}s")
            
            # Merge data
            if all_data.empty:
                all_data = province_data
            else:
                all_data = pd.merge(all_data, province_data, on="Date", how="outer")
        
        print(f"[INFO] Total records processed: {len(all_data)}")
        
        # Format data based on dataset type before creating file
        print(f"[INFO] Formatting {download_record['dataset']} data...")
        if download_record["dataset"] == "precipitation":
            # Format precipitation: 2 decimals, values < 1 mm set to 0
            for col in all_data.columns:
                if col != 'Date':
                    all_data[col] = all_data[col].apply(
                        lambda x: 0.0 if pd.notna(x) and float(x) < 1.0 
                        else round(float(x), 2) if pd.notna(x) 
                        else x
                    )
            print(f"[INFO] Precipitation data formatted: 2 decimals, values < 1 mm set to 0")
        elif download_record["dataset"] == "temperature":
            # Format temperature: 1 decimal
            for col in all_data.columns:
                if col != 'Date':
                    all_data[col] = all_data[col].apply(
                        lambda x: round(float(x), 1) if pd.notna(x) 
                        else x
                    )
            print(f"[INFO] Temperature data formatted: 1 decimal")
        
        # Validate data before creating file
        if all_data.empty:
            raise Exception("No data retrieved for the specified parameters")
        
        # Create temporary file with better error handling
        print(f"[INFO] Creating Excel file...")
        temp_file_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as temp_file:
                all_data.to_excel(temp_file.name, index=False, engine="openpyxl")
                temp_file_path = temp_file.name
            
            # Generate descriptive filename
            provinces_str = "_".join(download_record['provinces'])
            dataset_type = download_record['dataset']
            date_start = download_record['date_start'].replace('-', '')
            date_end = download_record['date_end'].replace('-', '')
            
            # Create descriptive filename: Province_DatasetType_StartDate_EndDate_DownloadID.xlsx
            filename = f"{provinces_str}_{dataset_type}_data_{date_start}_{date_end}_{download_id}.xlsx"
            file_path = f"{download_record['requested_by_user_id']}/{filename}"
            print(f"[INFO] Uploading file to Supabase storage: {file_path}")
            
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    with open(temp_file_path, "rb") as f:
                        file_content = f.read()
                        supabase.storage.from_("weather-data-downloads").upload(
                            file_path, file_content
                        )
                    print(f"[INFO] File uploaded successfully on attempt {attempt + 1}")
                    break
                except Exception as upload_error:
                    if attempt == max_retries - 1:
                        raise Exception(f"Failed to upload file after {max_retries} attempts: {str(upload_error)}")
                    print(f"[WARNING] Upload attempt {attempt + 1} failed, retrying...")
                    time.sleep(2 ** attempt)  # Exponential backoff
            
            # Generate signed URL with longer expiry for stored URL
            print(f"[INFO] Generating signed URL...")
            signed_url_response = supabase.storage.from_("weather-data-downloads").create_signed_url(
                file_path, 86400 * 7  # 7 days expiry for stored URL
            )
            
            if not signed_url_response.get('signedURL'):
                raise Exception("Failed to generate signed URL")
            
            signed_url = signed_url_response['signedURL']
            
        finally:
            # Clean up temporary file
            if temp_file_path and os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                print(f"[INFO] Temporary file cleaned up")
        
        # Update status to completed with signed URL
        print(f"[INFO] Updating database with completion status...")
        supabase.table("weather_downloads")\
            .update({
                "status": WeatherDownloadStatus.COMPLETED.value,
                "file_url": signed_url,
                "updated_at": "now()"
            })\
            .eq("id", download_id)\
            .execute()
        
        print(f"[INFO] Data retrieval completed successfully for download_id: {download_id}")
        print(f"[INFO] Generated filename: {filename}")
        return {
            "status": "completed", 
            "file_url": file_path,
            "filename": filename,
            "signed_url": signed_url,
            "records_processed": len(all_data),
            "provinces_processed": len(download_record["provinces"])
        }
        
    except Exception as e:
        error_message = str(e)
        error_traceback = traceback.format_exc()
        
        print(f"[ERROR] Data retrieval failed for download_id: {download_id}")
        print(f"[ERROR] Error: {error_message}")
        print(f"[ERROR] Traceback: {error_traceback}")
        
        # Update status to failed with detailed error information
        try:
            supabase.table("weather_downloads")\
                .update({
                    "status": WeatherDownloadStatus.FAILED.value,
                    "error_message": error_message,
                    "updated_at": "now()"
                })\
                .eq("id", download_id)\
                .execute()
        except Exception as db_error:
            print(f"[ERROR] Failed to update database with error status: {str(db_error)}")
        
        # Re-raise the original exception for Celery to handle
        raise e

@celery_app.task(name="premium_task")
def premium_task(request_dict):
    # Log task execution for debugging
    import uuid
    task_id = str(uuid.uuid4())[:8]  # Generate a short task ID for logging
    print(f"[INFO] Starting premium_task: {task_id}")
    
    try:
        # Convert dict to PremiumRequest
        request = PremiumRequest(**request_dict)
        result = calculate_premium(request)
        return result
    except Exception as e:
        # Log the error and re-raise
        print(f"Error in premium_task: {str(e)}")
        raise

@celery_app.task(name="insure_smart_optimize_task")
def insure_smart_optimize_task(request_dict):
    # Log task execution for debugging
    import uuid
    task_id = str(uuid.uuid4())[:8]  # Generate a short task ID for logging
    print(f"[INFO] Starting insure_smart_optimize_task: {task_id}")
    
    try:
        print(f"Starting insure_smart_optimize_task with request: {request_dict}")
        result = optimize_insure_smart(request_dict)
        return result
    except Exception as e:
        print(f"Error in insure_smart_optimize_task: {str(e)}")
        raise