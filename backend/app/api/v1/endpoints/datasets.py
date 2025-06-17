from fastapi import APIRouter, UploadFile, File, HTTPException
from ...services.dataset_service import DatasetService

router = APIRouter(prefix="/datasets", tags=["datasets"])
service = DatasetService()


@router.get("/")
async def list_datasets():
    return service.list_datasets()


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    path = service.save_dataset(file)
    return {"dataset_id": path}
