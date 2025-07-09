from uuid import uuid4
import time
from fastapi import APIRouter, HTTPException
from countries.cambodia import get_communes_geodataframe
from celery_worker import data_task


# Set up the FastAPI router
router = APIRouter(
    prefix="/api",
    tags=["climate-data"],
    responses={404: {"description": "Not found"}},
)

# Load GeoDataFrame with communes
communes_gdf = get_communes_geodataframe()


@router.get("/climate-data")
async def get_climate_data(
    province: str, start_date: str, end_date: str, data_type: str
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

    # Use delay() method which is more reliable for simple task calls
    task = data_task.delay(province, start_date, end_date, data_type, file_name)

    return {
        "message": f"{data_type.capitalize()} data retrieval has been initiated.",
        "filename": file_name,
        "task_id": task.id,  # Return the task ID
    }
