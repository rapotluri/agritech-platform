from celery import Celery
import os

# Initialize Celery
celery_app = Celery(
    "tasks",
    broker=os.getenv("REDIS_URL"),
)
