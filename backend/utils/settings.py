# backend/utils/settings.py
from countries.cambodia import get_communes_geodataframe  # Import from cambodia.py

# This file should now only include global settings or configurations.
# Define allowed origins for CORS
origins = [
    "http://localhost:3000",  # For local testing
    "https://agritech-prod.vercel.app",  # Deployed frontend on Vercel
]
