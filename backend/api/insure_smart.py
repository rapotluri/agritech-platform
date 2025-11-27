from fastapi import APIRouter, HTTPException
from celery_worker import insure_smart_optimize_task
from countries.cambodia import validate_location

router = APIRouter(
    prefix="/api/insure-smart",
    tags=["insure-smart"]
)

@router.post("/optimize")
async def optimize_insure_smart(request: dict):
    """
    Start InsureSmart optimization task.
    
    All location names must be in canonical format (with spaces preserved).
    Example: province="Banteay Meanchey", district="Mongkol Borei", commune="Banteay Neang"
    
    Request format:
    {
        "product": {
            "commune": str,  # Commune name in canonical format (e.g., "Banteay Neang")
            "province": str,  # Province name in canonical format (e.g., "Banteay Meanchey")
            "district": str,  # District name in canonical format (e.g., "Mongkol Borei") - Required when commune is provided
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
    
    If location validation fails, error messages will include available options.
    """
    try:
        # Validate location if product is provided
        product = request.get("product", {})
        if product:
            province = product.get("province")
            district = product.get("district")
            commune = product.get("commune")
            
            if commune and not district:
                raise HTTPException(
                    status_code=400,
                    detail="District is required when commune is provided"
                )
            
            if province:
                from countries.cambodia import get_all_provinces, get_districts_for_province, get_communes_for_district
                if district and commune:
                    if not validate_location(province, district, commune):
                        # Provide helpful error message with suggestions
                        if not validate_location(province):
                            available_provinces = get_all_provinces()
                            raise HTTPException(
                                status_code=400,
                                detail=f"Invalid province: '{province}'. Province must be in canonical format (e.g., 'Banteay Meanchey'). Available provinces: {available_provinces}"
                            )
                        elif not validate_location(province, district):
                            available_districts = get_districts_for_province(province)
                            raise HTTPException(
                                status_code=400,
                                detail=f"Invalid district: '{district}' in province '{province}'. District must be in canonical format. Available districts: {available_districts}"
                            )
                        else:
                            available_communes = get_communes_for_district(province, district)
                            raise HTTPException(
                                status_code=400,
                                detail=f"Invalid commune: '{commune}' in district '{district}', province '{province}'. Commune must be in canonical format. Available communes: {available_communes}"
                            )
                elif district:
                    if not validate_location(province, district):
                        if not validate_location(province):
                            available_provinces = get_all_provinces()
                            raise HTTPException(
                                status_code=400,
                                detail=f"Invalid province: '{province}'. Province must be in canonical format. Available provinces: {available_provinces}"
                            )
                        else:
                            available_districts = get_districts_for_province(province)
                            raise HTTPException(
                                status_code=400,
                                detail=f"Invalid district: '{district}' in province '{province}'. District must be in canonical format. Available districts: {available_districts}"
                            )
                else:
                    if not validate_location(province):
                        available_provinces = get_all_provinces()
                        raise HTTPException(
                            status_code=400,
                            detail=f"Invalid province: '{province}'. Province must be in canonical format (e.g., 'Banteay Meanchey'). Available provinces: {available_provinces}"
                        )
        
        task = insure_smart_optimize_task.delay(request)
        return {"message": "Optimization started.", "task_id": task.id}
    except HTTPException:
        raise
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