from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.config import settings
import os
import json

router = APIRouter()

SETTINGS_FILE = os.environ.get("CODETUNE_SETTINGS_FILE", "settings.json")


class SettingsUpdate(BaseModel):
    local_model_dir: str | None = None
    dataset_dir: str | None = None
    hf_token: str | None = None
    hf_user: str | None = None


@router.get("/settings", response_model=SettingsUpdate)
def get_settings():
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, "r") as f:
            data = json.load(f)
        return SettingsUpdate(**data)
    # fallback to env/config
    return SettingsUpdate(
        local_model_dir=None,
        dataset_dir=None,
        hf_token=settings.huggingface_token,
        hf_user=None,
    )


@router.post("/settings", response_model=SettingsUpdate)
def update_settings(update: SettingsUpdate):
    data = update.dict()
    with open(SETTINGS_FILE, "w") as f:
        json.dump(data, f)
    return update
