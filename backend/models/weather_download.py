from pydantic import BaseModel, field_validator, model_validator, ValidationInfo
from typing import List, Optional
from datetime import date
from enum import Enum
from countries.cambodia import validate_location

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
    """
    Request model for weather data download.
    
    All location names (provinces, districts, communes) must be in canonical format
    (e.g., "Banteay Meanchey" with spaces preserved).
    
    If communes are provided, districts must also be provided.
    """
    dataset: WeatherDatasetType
    provinces: List[str]
    date_start: date
    date_end: date
    districts: Optional[List[str]] = None
    communes: Optional[List[str]] = None
    
    @field_validator('provinces')
    @classmethod
    def validate_provinces(cls, v: List[str]) -> List[str]:
        """Validate that all provinces exist in canonical location data."""
        for province in v:
            if not validate_location(province):
                raise ValueError(f"Invalid province: {province}. Province must be in canonical format (e.g., 'Banteay Meanchey').")
        return v
    
    @field_validator('districts')
    @classmethod
    def validate_districts(cls, v: Optional[List[str]], info: ValidationInfo) -> Optional[List[str]]:
        """Validate that all districts exist in canonical location data for the given provinces."""
        if v is None:
            return v
        
        # Get provinces from the model data
        provinces = info.data.get('provinces', []) if info.data else []
        if not provinces:
            return v
        
        invalid_districts = []
        for district in v:
            # Check if district exists in any of the provided provinces
            district_valid = any(validate_location(province, district) for province in provinces)
            if not district_valid:
                invalid_districts.append(district)
        
        if invalid_districts:
            raise ValueError(
                f"Invalid districts: {invalid_districts}. "
                "Districts must be in canonical format and must belong to one of the specified provinces."
            )
        return v
    
    @field_validator('communes')
    @classmethod
    def validate_communes(cls, v: Optional[List[str]], info: ValidationInfo) -> Optional[List[str]]:
        """Validate that all communes exist in canonical location data for the given districts."""
        if v is None:
            return v
        
        # Get provinces and districts from the model data
        data = info.data if info.data else {}
        provinces = data.get('provinces', [])
        districts = data.get('districts', [])
        
        if not provinces:
            return v
        
        # If communes are provided, districts must also be provided
        if not districts:
            raise ValueError(
                "Districts must be provided when communes are specified. "
                "Commune names are not unique across districts."
            )
        
        invalid_communes = []
        for commune in v:
            # Check if commune exists in any of the provided province-district combinations
            commune_valid = any(
                validate_location(province, district, commune)
                for province in provinces
                for district in districts
            )
            if not commune_valid:
                invalid_communes.append(commune)
        
        if invalid_communes:
            raise ValueError(
                f"Invalid communes: {invalid_communes}. "
                "Communes must be in canonical format and must belong to one of the specified districts."
            )
        return v
    
    @model_validator(mode='after')
    def validate_district_commune_relationship(self):
        """
        Ensure that districts are provided when communes are provided.
        This is a cross-field validation.
        """
        if self.communes is not None and len(self.communes) > 0:
            if self.districts is None or len(self.districts) == 0:
                raise ValueError(
                    "Districts must be provided when communes are specified. "
                    "Commune names are not unique across districts."
                )
        return self

class WeatherDownloadResponse(BaseModel):
    """Response model for weather data download."""
    id: str
    status: WeatherDownloadStatus
    file_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: str
    updated_at: str
