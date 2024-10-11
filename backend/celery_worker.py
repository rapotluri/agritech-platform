import os
import ee
import threading
import subprocess
import pandas as pd
from celery import Celery
from celery.signals import worker_process_init
from utils.gee_utils import initialize_gee
from weather.precipitation import retrieve_precipitation_data
from weather.temperature import retrieve_temperature_data
from countries.cambodia import get_communes_geodataframe

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


@celery_app.task
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
    file_path = os.path.join("files", file_name)
    print(f"[INFO] Saving data to file: {file_path}")
    # Save the DataFrame to the Excel file in the files directory
    result_df.to_excel(file_path, index=False)


# Function to run Celery worker
def run_celery_worker():
    celery_app.worker_main(["worker", "--loglevel=info"])


# Function to run Flower
def run_flower():
    subprocess.call(["celery", "-A", "worker", "flower", "--port=5555"])


if __name__ == "__main__":
    # Start Celery worker in one thread
    worker_thread = threading.Thread(target=run_celery_worker)
    worker_thread.start()

    # Start Flower in another thread
    flower_thread = threading.Thread(target=run_flower)
    flower_thread.start()

    # Wait for both threads to finish
    worker_thread.join()
    flower_thread.join()
