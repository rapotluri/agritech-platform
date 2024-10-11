from celery.result import AsyncResult
from fastapi import APIRouter
from celery_worker import celery_app


# Set up the FastAPI router
router = APIRouter(
    prefix="/api/tasks",
    tags=["tasks"],
    responses={404: {"description": "Not found"}},
)


@router.get("/{task_id}")
async def get_task_status(task_id: str):
    """
    Check the status of a Celery task using its task ID.
    Args:
    - task_id: The ID of the Celery task.
    """
    task_result = AsyncResult(task_id, app=celery_app)

    if task_result.state == "PENDING":
        # Task is still in progress
        response = {"task_id": task_id, "status": "Pending", "result": None}
    elif task_result.state != "FAILURE":
        # Task is completed successfully
        response = {
            "task_id": task_id,
            "status": task_result.state,
            "result": task_result.result,
        }
    else:
        # Task failed
        response = {
            "task_id": task_id,
            "status": "Failure",
            "result": str(task_result.info),  # This will contain the error message
        }

    return response
