from fastapi import APIRouter, Depends
from app.services.healthcheck_service import HealthCheckService

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/status")
async def get_status(service: HealthCheckService = Depends()):
    return service.get_status()


@router.get("/pulse")
async def pulse(service: HealthCheckService = Depends()):
    return service.pulse()
