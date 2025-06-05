from fastapi import FastAPI
from .core.config import settings
from .api.v1.api import api_router

app = FastAPI(title=settings.app_name)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "CodeTune backend running"}

