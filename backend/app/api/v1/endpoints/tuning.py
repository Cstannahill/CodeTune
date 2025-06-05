from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from ....core.database import db
from ....services.tuning_service import TuningService
from ....schemas.tuning import TuningCreate, Tuning, TuningProgress, PyObjectId

router = APIRouter(prefix="/tuning", tags=["tuning"])

def get_service():
    return TuningService(db)

@router.post("/", response_model=Tuning)
async def start_tuning(data: TuningCreate, service: TuningService = Depends(get_service)):
    return await service.create_task(data)

@router.get("/", response_model=list[Tuning])
async def list_tasks(service: TuningService = Depends(get_service)):
    return await service.list_tasks()

@router.get("/{task_id}", response_model=Tuning)
async def get_task(task_id: PyObjectId, service: TuningService = Depends(get_service)):
    task = await service.get_task(ObjectId(task_id))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.get("/{task_id}/progress", response_model=TuningProgress)
async def get_progress(task_id: PyObjectId, service: TuningService = Depends(get_service)):
    task = await service.get_task(ObjectId(task_id))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TuningProgress(task_id=task.id, progress=task.progress, status=task.status, result=task.result, updated_at=task.updated_at)
