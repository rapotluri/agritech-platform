from fastapi import FastAPI
from mangum import Mangum
from backend.api.climate_data import router as climate_data_router
from backend.api.premium import router as premium_router
from backend.api.task import router as task_router
from backend.api.serve_file import router as serve_file_router

app = FastAPI(
    title="Accurate API",
    description="API for climate data and premium calculations",
    version="1.0.0"
)

@app.get("/")
async def root():
    return {
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

app.include_router(climate_data_router)
app.include_router(premium_router)
app.include_router(task_router)
app.include_router(serve_file_router)

# Wrap the FastAPI app with Mangum
handler = Mangum(app)
