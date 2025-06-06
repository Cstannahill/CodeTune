from fastapi import APIRouter
from .endpoints import (
    tuning,
    analytics,
    assistant,
    models,
    user_models,
    ollama,
    settings,  # <-- add this
)

api_router = APIRouter()
api_router.include_router(tuning.router)
api_router.include_router(analytics.router)
api_router.include_router(assistant.router)
api_router.include_router(models.router)
api_router.include_router(user_models.router)
api_router.include_router(ollama.router)
api_router.include_router(settings.router)
