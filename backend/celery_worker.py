from http.server import BaseHTTPRequestHandler, HTTPServer
from multiprocessing import Process
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


class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"status": "active"}')


def run_http_server(port=8080):
    server_address = ("", port)
    httpd = HTTPServer(server_address, SimpleHandler)
    print(f"Server running on port {port}...")
    httpd.serve_forever()


if __name__ == "__main__":
    # Create a process for the Celery worker
    celery_process = Process(target=run_celery_worker)

    # Create a process for the HTTP server
    http_process = Process(target=run_http_server, args=(8080,))

    # Start both processes
    celery_process.start()
    http_process.start()

    # Join both processes to keep the main process running
    celery_process.join()
    http_process.join()
