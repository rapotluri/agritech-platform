from pydantic import BaseModel, field_validator, model_validator, ValidationInfo
from typing import List, Optional, Literal
from datetime import date
from enum import Enum
from countries import (
    SUPPORTED_COUNTRIES,
    get_country_module,
    validate_location as validate_country_location,
)

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
    
    All location names (provinces/states, districts/LGAs, communes) must be in canonical format.
    If communes are provided, districts must also be provided.
    """
    country: Literal["Cambodia", "Nigeria"] = "Cambodia"
    dataset: WeatherDatasetType
    provinces: List[str]
    date_start: date
    date_end: date
    districts: Optional[List[str]] = None
    communes: Optional[List[str]] = None
    
    @field_validator('country')
    @classmethod
    def validate_country(cls, v: str) -> str:
        if v not in SUPPORTED_COUNTRIES:
            raise ValueError(f"Unsupported country: {v}. Supported countries: {list(SUPPORTED_COUNTRIES)}")
        return v

    @field_validator('provinces')
    @classmethod
    def validate_provinces(cls, v: List[str], info: ValidationInfo) -> List[str]:
        country = info.data.get("country", "Cambodia") if info.data else "Cambodia"
        for province in v:
            if not validate_country_location(country, province):
                module = get_country_module(country)
                if country == "Nigeria":
                    available = module.get_all_states()
                else:
                    available = module.get_all_provinces()
                raise ValueError(
                    f"Invalid province/state for {country}: {province}. Available options: {available}"
                )
        return v
    
    @field_validator('districts')
    @classmethod
    def validate_districts(cls, v: Optional[List[str]], info: ValidationInfo) -> Optional[List[str]]:
        if v is None:
            return v
        
        data = info.data if info.data else {}
        country = data.get("country", "Cambodia")
        provinces = data.get('provinces', [])
        if not provinces:
            return v
        
        invalid_districts = []
        for district in v:
            district_valid = any(
                validate_country_location(country, province, district)
                for province in provinces
            )
            if not district_valid:
                invalid_districts.append(district)
        
        if invalid_districts:
            raise ValueError(
                f"Invalid districts for {country}: {invalid_districts}. "
                "Districts must be in canonical format and belong to one of the specified provinces/states."
            )
        return v
    
    @field_validator('communes')
    @classmethod
    def validate_communes(cls, v: Optional[List[str]], info: ValidationInfo) -> Optional[List[str]]:
        if v is None:
            return v
        
        data = info.data if info.data else {}
        country = data.get("country", "Cambodia")
        provinces = data.get('provinces', [])
        districts = data.get('districts', [])

        if country == "Nigeria" and v:
            raise ValueError("Communes are not supported for Nigeria. Use state and LGA only.")
        
        if not provinces:
            return v
        
        if not districts:
            raise ValueError(
                "Districts must be provided when communes are specified. "
                "Commune names are not unique across districts."
            )
        
        invalid_communes = []
        for commune in v:
            commune_valid = any(
                validate_country_location(country, province, district, commune)
                for province in provinces
                for district in districts
            )
            if not commune_valid:
                invalid_communes.append(commune)
        
        if invalid_communes:
            raise ValueError(
                f"Invalid communes: {invalid_communes}. "
                "Communes must be in canonical format and belong to one of the specified districts."
            )
        return v
    
    @model_validator(mode='after')
    def validate_district_commune_relationship(self):
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
    country: Optional[Literal["Cambodia", "Nigeria"]] = "Cambodia"
    status: WeatherDownloadStatus
    file_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: str
    updated_at: str
