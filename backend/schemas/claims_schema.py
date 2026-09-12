from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, validator


class ClaimLocation(BaseModel):
    country: str = "Cambodia"
    province: str
    district: str
    commune: str

    @validator("country", "province", "district", "commune")
    def non_empty(cls, v: str) -> str:
        if not v or not str(v).strip():
            raise ValueError("location fields must be non-empty")
        return str(v).strip()


class ClaimPeril(BaseModel):
    peril_type: Literal["LRI", "ERI", "LTI", "HTI"]
    trigger: float
    duration: int = Field(ge=1)
    unit_payout: float = Field(ge=0)
    max_payout: float = Field(ge=0)
    exit_trigger: Optional[float] = None
    exit: Optional[float] = None
    dailyCap: Optional[float] = None
    consecutiveDays: Optional[int] = None
    allocated_si: Optional[float] = None


class ClaimPeriod(BaseModel):
    start_day: Optional[int] = None
    end_day: Optional[int] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    perils: List[ClaimPeril]

    @validator("perils")
    def at_least_one_peril(cls, v: List[ClaimPeril]) -> List[ClaimPeril]:
        if not v:
            raise ValueError("each period must have at least one peril")
        return v


class ClaimTermsheetInput(BaseModel):
    periods: List[ClaimPeriod]
    sumInsured: float = Field(ge=0)
    plantingDate: Optional[str] = None
    dayIndexMode: Optional[str] = "day_of_year"  # day_of_year | planting_offset
    coveragePeriods: Optional[List[Dict[str, Any]]] = None

    @validator("periods")
    def at_least_one_period(cls, v: List[ClaimPeriod]) -> List[ClaimPeriod]:
        if not v:
            raise ValueError("termsheet must include at least one period")
        return v


class ClaimEvaluateRequest(BaseModel):
    location: ClaimLocation
    evaluation_start: str
    evaluation_end: str
    termsheet: ClaimTermsheetInput
    sum_insured_scale: float = Field(default=1.0, gt=0)
    enrollment_id: Optional[str] = None
    product_id: Optional[str] = None
    source: Literal["enrollment", "product", "manual"] = "manual"

    @validator("evaluation_start", "evaluation_end")
    def date_format(cls, v: str) -> str:
        if not v or len(v) < 8:
            raise ValueError("dates must be YYYY-MM-DD")
        return v
