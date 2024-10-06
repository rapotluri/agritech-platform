from contextlib import asynccontextmanager
from fastapi import FastAPI
from api import precipitation
from fastapi.middleware.cors import CORSMiddleware
import ee
import os
from api import commune_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    service_account = "accurate-596@accurate-436800.iam.gserviceaccount.com"
    file = os.getcwd() + "\\api\\accurate-436800-7ed6a0dbbaf7.json"
    credentials = ee.ServiceAccountCredentials(service_account, file)
    ee.Initialize(credentials)
    yield


app = FastAPI(lifespan=lifespan)

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(precipitation.router)

app.include_router(commune_data.router) 



@app.get("/")
async def read_root():
    return {"Hello": "AccurRate"}
