from pydantic import BaseModel
from .base import DBModelMixin, PyObjectId


class SavedModelCreate(BaseModel):
    name: str
    dataset_id: str | None = None
    parameters: dict | None = None
    result: dict | None = None


class SavedModel(DBModelMixin):
    name: str
    dataset_id: str | None = None
    parameters: dict | None = None
    result: dict | None = None
    local_path: str | None = None  # Add this field for save location
    hf_repo_id: str | None = None
