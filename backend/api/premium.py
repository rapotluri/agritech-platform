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
        # Convert Pydantic model to dict for Celery serialization
        request_dict = request.dict(by_alias=True)
        task = premium_task.delay(request_dict)
        return {
            "message": "Premium Calculation has been initiated.",
            "task_id": task.id
        }
    except Exception as e:
        print(f"Error in calculate_premium_endpoint: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) 