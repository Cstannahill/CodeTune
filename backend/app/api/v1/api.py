from fastapi import APIRouter
from .endpoints import tuning, analytics

api_router = APIRouter()
api_router.include_router(tuning.router)
api_router.include_router(analytics.router)
