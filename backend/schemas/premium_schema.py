from pydantic import BaseModel
from typing import List
from datetime import date

class Index(BaseModel):
    phaseName: str
    phaseStartDate: date
    phaseEndDate: date
    type: str
    trigger: float
    exit: float
    dailyCap: float
    unitPayout: float
    maxPayout: float
    consecutiveDays: int

class PremiumRequest(BaseModel):
    productName: str
    commune: str
    cropType: str
    growingDuration: int
    weatherDataPeriod: int
    plantingDate: date
    indexes: List[Index]
    coverageType: str
    province: str
    dataType: str 