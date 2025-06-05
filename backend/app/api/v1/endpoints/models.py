from fastapi import APIRouter
from fastapi.concurrency import run_in_threadpool
from huggingface_hub import list_models
from ....core.config import settings

router = APIRouter(prefix="/models", tags=["models"])

@router.get("/")
async def get_models():
    models = await run_in_threadpool(
        list_models, filter="text-generation", limit=20, token=settings.huggingface_token
    )
    return [{"id": m.modelId, "downloads": m.downloads} for m in models]
