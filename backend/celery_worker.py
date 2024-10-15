import os
import ee
import pandas as pd
from http.server import BaseHTTPRequestHandler, HTTPServer
from multiprocessing import Process
from celery import Celery
from celery.signals import worker_process_init
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

    print(f"[INFO] Data retrieval complete for {data_type} data")
    # Create a physical Excel file
    file_path = os.path.join(os.getcwd(), "files", file_name)
    result_df.to_excel(file_path, index=False, engine="openpyxl")

    # Get MongoDB GridFS instance and upload the file
    fs = get_mongodb_fs()
    with open(file_path, "rb") as file:
        file_id = fs.put(file, filename=file_name)  # Upload the file to GridFS

    # Delete the local file after upload
    if os.path.exists(file_path):
        os.remove(file_path)
        print(f"[INFO] Local file deleted: {file_path}")

    # Return the file ID from MongoDB
    return str(file_id)
