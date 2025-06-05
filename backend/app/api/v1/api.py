from fastapi import APIRouter
from .endpoints import tuning, analytics, assistant, models

api_router = APIRouter()
api_router.include_router(tuning.router)
api_router.include_router(analytics.router)
api_router.include_router(assistant.router)
api_router.include_router(models.router)
