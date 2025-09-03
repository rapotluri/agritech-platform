from fastapi import APIRouter, HTTPException
from celery_worker import insure_smart_optimize_task

router = APIRouter(
    prefix="/api/insure-smart",
    tags=["insure-smart"]
)

@router.post("/optimize")
async def optimize_insure_smart(request: dict):
    """
    Start InsureSmart optimization task.
    
    Request format:
    {
        "product": {
            "commune": str,
            "province": str,
            "sumInsured": str,
            "premiumCap": str,
            "dataType": "precipitation" | "temperature"  # Optional, defaults to "precipitation"
        },
        "periods": [
            {
                "startDate": str,
                "endDate": str,
                "perilType": "LRI" | "ERI" | "LTI" | "HTI" | "Both"
            }
        ]
    }
    
    Returns:
        {"message": str, "task_id": str}
    """
    try:
        task = insure_smart_optimize_task.delay(request)
        return {"message": "Optimization started.", "task_id": task.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start optimization: {str(e)}")

@router.get("/status/{task_id}")
async def get_optimization_status(task_id: str):
    from celery.result import AsyncResult
    from celery_worker import celery_app
    import time
    
    task_result = AsyncResult(task_id, app=celery_app)
    print(f"Task {task_id} state: {task_result.state}")
    print(f"Task {task_id} info: {task_result.info}")
    
    # Add a small delay to ensure task result is available
    if task_result.state == "STARTED":
        time.sleep(0.1)  # Small delay to let task complete
        task_result = AsyncResult(task_id, app=celery_app)  # Refresh result
        print(f"Task {task_id} state after delay: {task_result.state}")
    
    if task_result.state == "PENDING":
        return {"task_id": task_id, "status": "Pending", "result": None}
    elif task_result.state == "SUCCESS":
        print(f"Task {task_id} completed successfully")
        result = task_result.result
        print(f"Task {task_id} result type: {type(result)}")
        return {"task_id": task_id, "status": "SUCCESS", "result": result}
    elif task_result.state == "STARTED":
        # Task is still running
        return {"task_id": task_id, "status": "Pending", "result": None}
    else:
        print(f"Task {task_id} failed with state: {task_result.state}")
        return {"task_id": task_id, "status": "FAILURE", "result": str(task_result.info)} 