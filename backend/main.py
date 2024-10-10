from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.climate_data import router as climate_data_router
from api.serve_file import router as serve_file_router  # Import serve_file router

# Initialize FastAPI app
app = FastAPI(
    title="AccuRate Climate Data API",
    description="API for retrieving climate data for communes within a province",
    version="1.0.0",
)

# Set up CORS middleware (add your frontend URL here)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow requests only from the frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the climate data and file routers
app.include_router(climate_data_router)
app.include_router(serve_file_router)

# Root endpoint for testing
@app.get("/")
async def root():
    return {"message": "Welcome to the AccuRate Climate Data API!"}
