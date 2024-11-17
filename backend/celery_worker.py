import os
import ee
import pandas as pd
from celery import Celery
from celery.signals import worker_process_init
from backend.utils.gee_utils import initialize_gee
from backend.weather.precipitation import retrieve_precipitation_data
from backend.weather.temperature import retrieve_temperature_data
from backend.countries.cambodia import get_communes_geodataframe
from io import BytesIO
from backend.utils.s3 import upload_file
from backend.utils.dynamo import store_task_result
from backend.utils.config import REDIS_HOST, REDIS_PORT

# Initialize Celery
celery_app = Celery(
    "tasks",
    broker=f"redis://{REDIS_HOST}:{REDIS_PORT}/0",
    backend=f"redis://{REDIS_HOST}:{REDIS_PORT}/0"
)

celery_app.conf.update(
    broker_connection_retry_on_startup=True,
    result_expires=3600,
    task_track_started=True,
    task_serializer='json',
    result_serializer='json',
    accept_content=['json']
)

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

    # Save to Excel in memory
    file_buffer = BytesIO()
    result_df.to_excel(file_buffer, index=False, engine="openpyxl")
    file_buffer.seek(0)

    # Upload to S3 and get URL
    file_url = upload_file(file_buffer, file_name)

    # Store task result in DynamoDB
    metadata = {
        "province": province,
        "start_date": start_date,
        "end_date": end_date,
        "data_type": data_type
    }
    store_task_result(str(data_task.request.id), file_url, metadata)

    return str(data_task.request.id)

# Add this test task
@celery_app.task(name="test_task")
def test_task():
    return "Test task completed successfully"
