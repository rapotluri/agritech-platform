import os
from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from api.climate_data import router as climate_data_router
from api.task import router as task_router
from utils.gee_utils_local import initialize_gee_local
from utils.gee_utils import initialize_gee
from utils.settings import origins
from api.premium import router as premium_router
from dotenv import load_dotenv
from api.insure_smart import router as insure_smart_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_dotenv()
    if os.getenv("ENV") == "LOCAL":
        initialize_gee_local()
    else:
        initialize_gee()
    yield
    print("Shutting down...")


# Initialize FastAPI app
app = FastAPI(
    title="AccuRate Climate Data API",
    description="API for retrieving climate data for communes within a province",
    version="1.0.0",
    lifespan=lifespan,
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(climate_data_router)
app.include_router(task_router)
app.include_router(premium_router)
app.include_router(insure_smart_router)

@app.get("/")
async def root():
    return {"message": "Welcome to the AccuRate Climate Data API!"}
