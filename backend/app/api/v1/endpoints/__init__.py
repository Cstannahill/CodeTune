from .tuning import router as tuning_router
from .analytics import router as analytics_router
from .assistant import router as assistant_router
from .models import router as models_router
from .user_models import router as user_models_router
from .ollama import router as ollama_router
from .healthcheck import router as healthcheck_router

__all__ = [
    "tuning_router",
    "analytics_router",
    "assistant_router",
    "models_router",
    "user_models_router",
    "ollama_router",
    "healthcheck_router",
]
