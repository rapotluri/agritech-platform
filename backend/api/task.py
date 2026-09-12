from celery.result import AsyncResult
from fastapi import APIRouter
from celery_worker import celery_app


# Set up the FastAPI router
router = APIRouter(
    prefix="/api/tasks",
    tags=["tasks"],
    responses={404: {"description": "Not found"}},
)

# Celery states that mean "still running" (not terminal failure).
# With task_track_started=True, STARTED exposes {pid, hostname} via .info —
# that must NOT be reported as Failure.
_IN_PROGRESS_STATES = {
    "PENDING",
    "STARTED",
    "RECEIVED",
    "RETRY",
    "PROGRESS",
}


@router.get("/{task_id}")
async def get_task_status(task_id: str):
    """
    Check the status of a Celery task using its task ID.
    Args:
    - task_id: The ID of the Celery task.
    """
    task_result = AsyncResult(task_id, app=celery_app)
    state = task_result.state

    if state in _IN_PROGRESS_STATES:
        return {
            "task_id": task_id,
            "status": "Pending" if state == "PENDING" else state,
            "result": None,
        }

    if state == "SUCCESS":
        return {
            "task_id": task_id,
            "status": "SUCCESS",
            "result": task_result.result,
        }

    # Terminal failure states: FAILURE, REVOKED, etc.
    info = task_result.info
    if isinstance(info, BaseException):
        detail = str(info)
    elif info is not None:
        detail = str(info)
    else:
        detail = f"Task ended with state {state}"

    return {
        "task_id": task_id,
        "status": "FAILURE",
        "result": detail,
    }
