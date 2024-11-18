from fastapi import APIRouter, HTTPException
from celery_worker import premium_task
from schemas.premium_schema import PremiumRequest
from services.premium_calculator import calculate_premium

router = APIRouter(
    prefix="/api/premium",
    tags=["premium"]
)

@router.post("/calculate")
async def calculate_premium_endpoint(request: PremiumRequest):
    try:
        task = premium_task.delay(request)
        return {
            "message": "Premium Calculation has been initiated.",
            "task_id": task.id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 