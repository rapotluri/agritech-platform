import time

# Simple worker script that runs indefinitely to keep the service alive
while True:
    print("Worker is running...")
    time.sleep(300)  # Sleep for 5 minutes before logging again
