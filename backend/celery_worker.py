import os
import ee
import pandas as pd
from http.server import BaseHTTPRequestHandler, HTTPServer
from multiprocessing import Process
from celery import Celery
from celery.signals import worker_process_init
from services.premium_calculator import calculate_premium
from schemas.premium_schema import PremiumRequest
from utils.mongo import get_mongodb_fs
from utils.gee_utils import initialize_gee
from weather.precipitation import retrieve_precipitation_data
from weather.temperature import retrieve_temperature_data
from countries.cambodia import get_communes_geodataframe
from io import BytesIO

# Initialize Celery
celery_app = Celery(
    "tasks",
    broker=os.getenv("REDIS_URL"),
    backend=os.getenv("REDIS_URL"),
)

celery_app.conf.broker_connection_retry_on_startup = True

# Load GeoDataFrame with communes
communes_gdf = get_communes_geodataframe()


@worker_process_init.connect
def init_worker(**kwargs):
    initialize_gee()


@celery_app.task(name="data_task")
def data_task(province, start_date, end_date, data_type, file_name):
    if not ee.data._credentials:  # type: ignore
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

    file_buffer = BytesIO()
    result_df.to_excel(file_buffer, index=False, engine="openpyxl")  # Convert to bytes
    file_buffer.seek(0)
    fs = get_mongodb_fs()
    file_id = fs.put(file_buffer, filename=file_name)

    return str(file_id)

@celery_app.task(name="premium_task")
def premium_task(request_dict):
    try:
        # Convert dict to PremiumRequest
        request = PremiumRequest(**request_dict)
        result = calculate_premium(request)
        return result
    except Exception as e:
        # Log the error and re-raise
        print(f"Error in premium_task: {str(e)}")
        raise