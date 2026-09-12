from fastapi import APIRouter, Depends, HTTPException
from celery_worker import claims_evaluate_task
from schemas.claims_schema import ClaimEvaluateRequest
from utils.auth import get_current_user

router = APIRouter(
    prefix="/api/claims",
    tags=["claims"],
    responses={404: {"description": "Not found"}},
)


@router.post("/evaluate")
async def evaluate_claim_endpoint(
    request: ClaimEvaluateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Start async claim evaluation (GEE weather + payout math).
    Poll GET /api/tasks/{task_id} for status/result.
    """
    try:
        loc = request.location
        if not loc.commune or not loc.district or not loc.province:
            raise HTTPException(
                status_code=400,
                detail="province, district, and commune are required",
            )

        request_dict = request.dict()
        request_dict["_requested_by_user_id"] = current_user["id"]
        task = claims_evaluate_task.delay(request_dict)
        return {
            "message": "Claim evaluation has been initiated.",
            "task_id": task.id,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in evaluate_claim_endpoint: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
