import os
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
from countries.cambodia import get_communes_geodataframe
from io import BytesIO
from dotenv import load_dotenv
from services.insure_smart_optimizer import optimize_insure_smart

load_dotenv()

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
    
    if os.getenv("ENV") == "LOCAL":
        print("[DEBUG] Initializing GEE with local credentials")
        initialize_gee_local()
    else:
        print("[DEBUG] Initializing GEE with production credentials")
        initialize_gee()
    
    print("[DEBUG] Worker initialization completed")

@celery_app.task(name="data_task")
def data_task(province, start_date, end_date, data_type, file_name):
    # Log task execution for debugging
    import uuid
    task_id = str(uuid.uuid4())[:8]  # Generate a short task ID for logging
    print(f"[INFO] Starting data_task: {task_id} for {province}, {data_type}")
    print(f"[DEBUG] Task args: province={province}, start_date={start_date}, end_date={end_date}, data_type={data_type}, file_name={file_name}")
    
    if not ee.data._credentials:  # type: ignore
        if os.getenv("ENV") == "LOCAL":
            initialize_gee_local()
        else:
            initialize_gee()

    # Filter for the specified province
    province_gdf = communes_gdf[communes_gdf["normalized_NAME_1"] == province]
    result_df = pd.DataFrame()
    # Retrieve data based on the selected data type
    if data_type == "precipitation":
        result_df = retrieve_precipitation_data(province_gdf, start_date, end_date)
    elif data_type == "temperature":
        result_df = retrieve_temperature_data(province_gdf, start_date, end_date)

    print(f"[INFO] Data retrieval completed for {data_type} data.")

    # Save the file locally
    file_path = os.path.join(os.getcwd(), "files", file_name)
    result_df.to_excel(file_path, index=False, engine="openpyxl")
    
    return file_name  # Return the filename instead of MongoDB file ID

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