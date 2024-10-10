import os
from uuid import uuid4
from fastapi import APIRouter, HTTPException, BackgroundTasks
from countries.cambodia import get_communes_geodataframe
from utils.gee_utils import initialize_gee
import ee
import pandas as pd
from weather.precipitation import retrieve_precipitation_data
from weather.temperature import retrieve_temperature_data

# Set up the FastAPI router
router = APIRouter(
    prefix="/api",
    tags=["climate-data"],
    responses={404: {"description": "Not found"}},
)

# Load GeoDataFrame with communes
communes_gdf = get_communes_geodataframe()


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


@router.get("/climate-data")
async def get_climate_data(
    province: str,
    start_date: str,
    end_date: str,
    data_type: str,
    background_tasks: BackgroundTasks,
):
    """
    Retrieve daily climate data for all communes within the specified province.
    Args:
    - province: The province name (e.g., "KampongSpeu").
    - start_date: The start date in the format 'YYYY-MM-DD'.
    - end_date: The end date in the format 'YYYY-MM-DD'.
    - data_type: Type of climate data to retrieve (e.g., "precipitation" or "temperature").
    """
    if data_type not in ["precipitation", "temperature"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid data type. Please specify 'precipitation' or 'temperature'.",
        )

    province_gdf = communes_gdf[communes_gdf["normalized_NAME_1"] == province]
    if province_gdf.empty:
        raise HTTPException(
            status_code=404, detail=f"No communes found for province: {province}"
        )

    uuid = uuid4()
    file_name = f"{province}_{data_type}_data_{uuid}.xlsx"

    background_tasks.add_task(
        data_task, province, start_date, end_date, data_type, file_name
    )

    return {
        "message": f"{data_type.capitalize()} data retrieved successfully",
        "filename": file_name,
    }
