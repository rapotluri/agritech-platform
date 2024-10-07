from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.climate_data import router as climate_data_router

# Initialize FastAPI app
app = FastAPI(
    title="AccuRate Climate Data API",
    description="API for retrieving climate data for communes within a province",
    version="1.0.0",
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the climate data router
app.include_router(climate_data_router)

# Root endpoint for testing
@app.get("/")
async def root():
    return {"message": "Welcome to the AccuRate Climate Data API!"}
