from datetime import date
from fastapi import APIRouter
from pydantic import BaseModel
import json


class Precipitation(BaseModel):
    location: str
    date: date
    precipitation: float


router = APIRouter(
    prefix="/api/preciptation",
    tags=["events"],
    responses={404: {"description": "Not found"}},
)


@router.get("/date")
async def get_precipitation():
    json_data = ""
    return json.loads(json_data)
