from datetime import datetime
from pydantic import BaseModel, Field
from .base import DBModelMixin, PyObjectId

class TuningCreate(BaseModel):
    dataset_id: str
    parameters: dict

class Tuning(DBModelMixin):
    dataset_id: str
    parameters: dict
    status: str = "queued"
    progress: float = 0.0
    result: dict | None = None

class TuningProgress(BaseModel):
    task_id: PyObjectId
    progress: float
    status: str
    result: dict | None = None
    updated_at: datetime | None = None
