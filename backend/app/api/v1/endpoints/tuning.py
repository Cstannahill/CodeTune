from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
import logging

from ....core.database import db
from ....services.tuning_service import TuningService
from ....schemas.tuning import TuningCreate, Tuning, TuningProgress, PyObjectId

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tuning", tags=["tuning"])


def get_service():
    # Always use the real TuningService
    return TuningService(db)


@router.post("/")  # returning raw JSON so fallback with mock UUID can pass through
async def start_tuning(data: TuningCreate, service=Depends(get_service)):
    """
    Create a tuning task (production).
    """
    logger.info("Starting tuning task", extra={"data": data.dict()})
    task = await service.create_task(data)
    logger.info("Created tuning task", extra={"task_id": str(task.id)})
    # Return only the generated task ID for polling
    return {"id": str(task.id)}


@router.get("/", response_model=list[Tuning])
async def list_tasks(service=Depends(get_service)):
    try:
        return await service.list_tasks()
    except Exception as e:
        print(f"Error listing tuning tasks: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to list tuning tasks: {str(e)}"
        )


@router.get("/{task_id}", response_model=Tuning)
async def get_task(task_id: str, service=Depends(get_service)):
    try:
        # Handle both ObjectId and string task IDs
        search_id = ObjectId(task_id) if hasattr(service, "collection") else task_id
        task = await service.get_task(search_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task
    except Exception as e:
        print(f"Error getting tuning task: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get tuning task: {str(e)}"
        )


@router.get("/{task_id}/progress", response_model=TuningProgress)
async def get_progress(task_id: str, service=Depends(get_service)):
    try:
        # Handle both ObjectId and string task IDs
        search_id = ObjectId(task_id) if hasattr(service, "collection") else task_id
        task = await service.get_task(search_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return TuningProgress(
            task_id=str(task.id),
            progress=task.progress,
            status=task.status,
            result=task.result,
            updated_at=task.updated_at,
        )
    except Exception as e:
        print(f"Error getting tuning progress: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get tuning progress: {str(e)}"
        )
