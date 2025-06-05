from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from ....core.database import db
from ....services import ModelService, TuningService
from ....schemas.model import SavedModel, SavedModelCreate, PyObjectId
from ....schemas.tuning import Tuning, TuningCreate

router = APIRouter(prefix="/user-models", tags=["user-models"])


def get_model_service():
    return ModelService(db)

def get_tuning_service():
    return TuningService(db)


@router.get("/", response_model=list[SavedModel])
async def list_models(service: ModelService = Depends(get_model_service)):
    return await service.list_models()


@router.post("/", response_model=SavedModel)
async def save_model(payload: SavedModelCreate, service: ModelService = Depends(get_model_service)):
    return await service.save_model(payload)


@router.post("/import/{model_id}", response_model=Tuning)
async def import_model(model_id: PyObjectId, tuning_service: TuningService = Depends(get_tuning_service), model_service: ModelService = Depends(get_model_service)):
    model = await model_service.get_model(ObjectId(model_id))
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    create = TuningCreate(dataset_id=model.dataset_id or "", parameters=model.parameters or {})
    return await tuning_service.create_task(create)


@router.delete("/{model_id}")
async def delete_model(model_id: PyObjectId, service: ModelService = Depends(get_model_service)):
    deleted = await service.delete_model(ObjectId(model_id))
    if not deleted:
        raise HTTPException(status_code=404, detail="Model not found")
    return {"status": "ok"}

