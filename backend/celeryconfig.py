import os
from dotenv import load_dotenv

load_dotenv()

broker_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
result_backend = os.getenv("REDIS_URL", "redis://localhost:6379/0")

task_serializer = 'json'
result_serializer = 'json'
accept_content = ['json']
timezone = 'UTC'
enable_utc = True

# Task settings
task_track_started = True
task_time_limit = 3600  # 1 hour
task_soft_time_limit = 3000  # 50 minutes

# Worker settings
worker_prefetch_multiplier = 1
worker_max_tasks_per_child = 50
worker_max_memory_per_child = 150000  # 150MB

# Fix for Windows
worker_pool = 'solo'
worker_pool_restarts = True
broker_connection_retry_on_startup = True

# Import tasks
imports = ('celery_worker',) 