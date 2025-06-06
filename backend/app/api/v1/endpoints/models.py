from fastapi import APIRouter, Body
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse
from huggingface_hub import list_models
from ....core.config import settings
from app.core.logger import logger  # new import
from app.services.hf_model_io import HFModelIO
import tempfile
import os
import json

router = APIRouter(prefix="/models", tags=["models"])


@router.get("/")
async def get_models():
    logger.log("Fetching Huggingface models...")
    models = await run_in_threadpool(
        list_models,
        filter="text-generation",
        limit=50,
        token=settings.huggingface_token,
        full=True,  # get all metadata
    )
    # Map to dicts with id, downloads, pipeline_tag (task), and tags (categories)
    items = [
        {
            "id": getattr(m, "modelId"),
            "downloads": getattr(m, "downloads", 0),
            "task": getattr(m, "pipeline_tag", None),
            "tags": getattr(m, "tags", []),
        }
        for m in models
    ]
    logger.table(
        title="Huggingface Models",
        columns=["Model ID", "Downloads", "Task", "Tags"],
        rows=[
            [it["id"], it["downloads"], it["task"], ", ".join(it["tags"] or [])]
            for it in items[:5]
        ],
    )
    return items


@router.post("/pull")
async def pull_hf_model(
    repo_id: str = Body(..., embed=True),
    local_dir: str = Body(None, embed=True),
):
    """Download a HuggingFace model to local storage."""
    # Try to load from settings file if present
    hf_token = os.environ.get("HF_TOKEN")
    hf_user = os.environ.get("HF_USER")
    settings_path = os.environ.get("CODETUNE_SETTINGS_FILE", "settings.json")
    if os.path.exists(settings_path):
        with open(settings_path, "r") as f:
            data = json.load(f)
            hf_token = data.get("hf_token", hf_token)
            hf_user = data.get("hf_user", hf_user)
    if not hf_token or not hf_user:
        return JSONResponse(
            status_code=400, content={"error": "HuggingFace credentials not set"}
        )
    if not local_dir:
        local_dir = tempfile.mkdtemp(prefix="hfmodel_")
    try:
        hf = HFModelIO(hf_token, hf_user)
        path = hf.download_model(repo_id, local_dir)
        return {"status": "ok", "local_dir": path}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.post("/push")
async def push_hf_model(
    local_dir: str = Body(..., embed=True),
    repo_name: str = Body(..., embed=True),
    private: bool = Body(True, embed=True),
):
    """Push a local model directory to HuggingFace Hub."""
    hf_token = os.environ.get("HF_TOKEN")
    hf_user = os.environ.get("HF_USER")
    settings_path = os.environ.get("CODETUNE_SETTINGS_FILE", "settings.json")
    if os.path.exists(settings_path):
        with open(settings_path, "r") as f:
            data = json.load(f)
            hf_token = data.get("hf_token", hf_token)
            hf_user = data.get("hf_user", hf_user)
    if not hf_token or not hf_user:
        return JSONResponse(
            status_code=400, content={"error": "HuggingFace credentials not set"}
        )
    try:
        hf = HFModelIO(hf_token, hf_user)
        repo_id = hf.push_model(local_dir, repo_name, private=private)
        return {"status": "ok", "repo_id": repo_id}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
