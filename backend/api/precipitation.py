from datetime import date
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel
import ee
import json


# Define a Pydantic model to validate input data
class DataRequest(BaseModel):
    lat: float
    long: float
    start_date: date
    end_date: date
    data_type: Optional[str] = None


router = APIRouter(
    prefix="/api",
    tags=["climate"],
    responses={404: {"description": "Not found"}},
)


@router.get("/data")
def get_data(
    lat: float,
    long: float,
    start_date: date,
    end_date: date,
    data_type: Optional[str] = None,
):
    # Load the CHIRPS dataset (daily precipitation data)
    chirps = (
        ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY")
        .filterDate(str(start_date), str(end_date))
        .select("precipitation")
    )

    # Define the point of interest (POI)
    poi = ee.Geometry.Point([lat, long])  # Example: Point in California

    # Get the pixel data for the specified point and time range
    chirps_data = chirps.getRegion(poi, scale=5000).getInfo()

    # Convert the data to JSON format
    chirps_json = []
    for entry in chirps_data[1:]:  # Skip the header row
        chirps_json.append(
            {
                "longitude": entry[0],
                "latitude": entry[1],
                "timestamp": entry[3],  # time in milliseconds
                "precipitation": entry[4],
            }
        )

    # Return the data as a JSON string
    chirps_json_str = json.dumps(chirps_json, indent=2)
    return chirps_json_str
