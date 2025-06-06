from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
import logging

from ....core.database import db
from ....services import ModelService, TuningService
from ....services.model_service import ModelService
from ....schemas.model import SavedModel, SavedModelCreate, PyObjectId
from ....schemas.tuning import Tuning, TuningCreate

router = APIRouter(prefix="/user-models", tags=["user-models"])

logger = logging.getLogger(__name__)


def get_model_service():
    try:
        # Try to use the real database service
        return ModelService(db)
    except Exception as e:
        logger.warning(f"Database connection failed, using mock service: {e}")
        return ModelService(db)


def get_tuning_service():
    return TuningService(db)


@router.get("/", response_model=list[SavedModel])
async def list_models(service=Depends(get_model_service)):
    try:
        return await service.list_models()
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        # Return empty list if database fails
        return []


@router.post("/", response_model=SavedModel)
async def save_model(
    payload: SavedModelCreate, service: ModelService = Depends(get_model_service)
):
    # Use settings or default for model_dir
    settings = service._load_settings()
    model_dir = settings.get("local_model_dir", "saved_models")
    saved = await service.save_model(payload, model_dir)
    return saved


@router.post("/import/{model_id}", response_model=Tuning)
async def import_model(
    model_id: PyObjectId,
    tuning_service: TuningService = Depends(get_tuning_service),
    model_service: ModelService = Depends(get_model_service),
):
    model = await model_service.get_model(ObjectId(model_id))
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    create = TuningCreate(
        dataset_id=model.dataset_id or "", parameters=model.parameters or {}
    )
    return await tuning_service.create_task(create)


@router.delete("/{model_id}")
async def delete_model(
    model_id: PyObjectId, service: ModelService = Depends(get_model_service)
):
    deleted = await service.delete_model(ObjectId(model_id))
    if not deleted:
        raise HTTPException(status_code=404, detail="Model not found")
    return {"status": "ok"}
