from fastapi import APIRouter, HTTPException
from celery.result import AsyncResult
from backend.countries.cambodia import get_communes_geodataframe
from backend.celery_worker import data_task

router = APIRouter()

@router.get("/climate-data/{task_id}")
async def get_task_status(task_id: str):
    task = AsyncResult(task_id)
    if task.ready():
        return {"status": "completed", "task_id": task_id}
    return {"status": "pending", "task_id": task_id}

@router.post("/climate-data")
async def get_climate_data(province: str, start_date: str, end_date: str, data_type: str, file_name: str):
    try:
        task = data_task.delay(province, start_date, end_date, data_type, file_name)
        return {"task_id": task.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
