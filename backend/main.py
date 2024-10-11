from turtle import back
from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from api.climate_data import router as climate_data_router
from api.serve_file import router as serve_file_router
from utils.gee_utils import initialize_gee
from utils.settings import origins
from celery import Celery
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
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
app.include_router(serve_file_router)

# Initialize Celery
celery_app = Celery(
    "tasks",
    broker=os.getenv("REDIS_URL"),
)


@celery_app.task(name="background_task")
def background_task():
    # Your background task logic here
    return "Task Completed"


@app.get("/")
async def root():
    background_task.delay()
    return {"message": "Welcome to the AccuRate Climate Data API!"}
