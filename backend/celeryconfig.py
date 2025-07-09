import os
from dotenv import load_dotenv

load_dotenv()

broker_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
result_backend = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Redis connection settings for production stability
broker_connection_retry_on_startup = True
broker_connection_retry = True
broker_connection_max_retries = 10
result_backend_transport_options = {
    'retry_policy': {
        'timeout': 5.0
    }
}

task_serializer = 'json'
result_serializer = 'json'
accept_content = ['json']
timezone = 'UTC'
enable_utc = True

# Task settings
task_track_started = True
task_time_limit = 3600  # 1 hour
task_soft_time_limit = 3000  # 50 minutes
task_acks_late = True  # Only acknowledge task after completion
task_reject_on_worker_lost = True  # Reject task if worker dies
task_visibility_timeout = 3600  # 1 hour visibility timeout

# Worker settings
worker_prefetch_multiplier = 1
worker_max_tasks_per_child = 50
worker_max_memory_per_child = 150000  # 150MB
worker_disable_rate_limits = True
worker_send_task_events = True
worker_enable_remote_control = False  # Disable remote control for security

# Worker pool settings
# Use 'solo' only on Windows, otherwise use 'prefork' for better stability
import platform
if platform.system() == 'Windows':
    worker_pool = 'solo'
else:
    worker_pool = 'prefork'
worker_pool_restarts = True
broker_connection_retry_on_startup = True

# Import tasks
imports = ('celery_worker',)

# Task routing and discovery
task_routes = {
    'data_task': {'queue': 'celery'},
    'premium_task': {'queue': 'celery'},
    'insure_smart_optimize_task': {'queue': 'celery'},
}

# Disable auto-discovery to prevent random task execution
task_always_eager = False
task_eager_propagates = True

# Result backend settings
result_expires = 3600  # Results expire after 1 hour
result_persistent = False  # Don't persist results to disk 