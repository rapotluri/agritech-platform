from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from enum import Enum

class WeatherDatasetType(str, Enum):
    """Enumeration for weather dataset types."""
    PRECIPITATION = "precipitation"
    TEMPERATURE = "temperature"

class WeatherDownloadStatus(str, Enum):
    """Enumeration for weather download status."""
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class WeatherDownloadRequest(BaseModel):
    """Request model for weather data download."""
    dataset: WeatherDatasetType
    provinces: List[str]
    date_start: date
    date_end: date
    districts: Optional[List[str]] = None
    communes: Optional[List[str]] = None

class WeatherDownloadResponse(BaseModel):
    """Response model for weather data download."""
    id: str
    status: WeatherDownloadStatus
    file_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: str
    updated_at: str
