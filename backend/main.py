from fastapi import FastAPI
from api import precipitation
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(precipitation.router)
# app.include_router(comments.router)


@app.get("/")
async def read_root():
    return {"Hello": "AccurRate"}
