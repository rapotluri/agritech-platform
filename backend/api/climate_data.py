from fastapi import APIRouter, HTTPException
import pandas as pd
from utils.settings import get_communes_geodataframe
from utils.gee_utils import initialize_gee
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

# Print all unique normalized province names for debugging
print(f"\n[DEBUG] Available normalized provinces: {communes_gdf['normalized_NAME_1'].unique()}")

@router.get("/climate-data")
async def get_climate_data(province: str, start_date: str, end_date: str, data_type: str = "precipitation"):
    """
    Retrieve daily climate data for all communes within the specified province.
    Args:
    - province: The province name (e.g., "KampongSpeu").
    - start_date: The start date in the format 'YYYY-MM-DD'.
    - end_date: The end date in the format 'YYYY-MM-DD'.
    - data_type: Type of climate data to retrieve (e.g., "precipitation" or "temperature").
    """
    # Initialize Google Earth Engine if not already initialized
    initialize_gee()

    # Print the province for debugging
    print(f"\n[DEBUG] Input province: {province}")

    # Filter for the specified province
    province_gdf = communes_gdf[communes_gdf["normalized_NAME_1"] == province]
    if province_gdf.empty:
        raise HTTPException(status_code=404, detail=f"No communes found for province: {province}")

    # Retrieve data based on the selected data type
    if data_type == "precipitation":
        result_df = retrieve_precipitation_data(province_gdf, start_date, end_date)
    elif data_type == "temperature":
        result_df = retrieve_temperature_data(province_gdf, start_date, end_date)
    else:
        raise HTTPException(status_code=400, detail=f"Invalid data type: {data_type}. Supported types: precipitation, temperature")

    # Export the DataFrame to an Excel file
    excel_filename = f"{province}_{data_type}_data.xlsx"
    result_df.to_excel(excel_filename, index=False)

    return {"message": f"{data_type.capitalize()} data retrieved successfully", "filename": excel_filename}
