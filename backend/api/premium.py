from fastapi import APIRouter, HTTPException
from backend.schemas.premium_schema import PremiumRequest
from backend.services.premium_calculator import calculate_premium

router = APIRouter(
    prefix="/api/premium",
    tags=["premium"]
)

@router.post("/calculate")
async def calculate_premium_endpoint(request: PremiumRequest):
    try:
        result = calculate_premium(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 