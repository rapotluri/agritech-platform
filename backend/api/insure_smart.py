from fastapi import APIRouter, HTTPException
from celery_worker import insure_smart_optimize_task

router = APIRouter(
    prefix="/api/insure-smart",
    tags=["insure-smart"]
)

@router.post("/optimize")
async def optimize_insure_smart(request: dict):
    try:
        task = insure_smart_optimize_task.delay(request)
        return {"message": "Optimization started.", "task_id": task.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start optimization: {str(e)}")

@router.get("/status/{task_id}")
async def get_optimization_status(task_id: str):
    from celery.result import AsyncResult
    from celery_worker import celery_app
    task_result = AsyncResult(task_id, app=celery_app)
    if task_result.state == "PENDING":
        return {"task_id": task_id, "status": "Pending", "result": None}
    elif task_result.state == "SUCCESS":
        return {"task_id": task_id, "status": "SUCCESS", "result": task_result.result}
    else:
        return {"task_id": task_id, "status": "FAILURE", "result": str(task_result.info)} 