from fastapi import (
    FastAPI,
    Request,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    Query,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .core.config import settings
from .api.v1.api import api_router
from app.services.healthcheck_service import HealthCheckService
from app.services.tuning_worker import TuningWorker
from app.core.database import db
import asyncio
import logging
from rich.logging import RichHandler
from app.core.logger import logger  # new import
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(message)s", handlers=[RichHandler()])
app = FastAPI(title=settings.app_name)
logger.log(f"Starting {settings.app_name} application")


# Register CORS middleware as the very first middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # Cannot allow credentials with wildcard origin
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers to the browser
    max_age=600,  # Cache preflight response for 600 seconds
)
logger.log("CORS middleware configured: allow all origins, methods, headers")

app.include_router(api_router, prefix="/api/v1")
logger.log("API router included at path /api/v1")


@app.get("/")
async def root():
    logger.log("Root endpoint called")
    return {"message": "CodeTune backend running"}


@app.on_event("startup")
async def startup_event():
    logger.log("Executing startup event: launching HealthCheckService continuous_pulse")
    health_service = HealthCheckService()
    asyncio.create_task(health_service.continuous_pulse())
    logger.log("HealthCheckService continuous_pulse task started")
    # Start TuningWorker
    worker = TuningWorker(db)
    asyncio.create_task(worker.run())
    logger.log("TuningWorker background task started")


# --- Global exception handlers to ensure CORS headers on all errors ---
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    response = JSONResponse(
        status_code=exc.status_code,
        content={"error": {"message": exc.detail, "type": "HTTPException"}},
    )
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Expose-Headers"] = "*"
    return response


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    response = JSONResponse(
        status_code=500,
        content={"error": {"message": str(exc), "type": "InternalServerError"}},
    )
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Expose-Headers"] = "*"
    return response


@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket, clientId: Optional[str] = Query(None)
):
    logger.log(f"WebSocket connection request: clientId={clientId}")
    await websocket.accept()
    try:
        logger.log(f"WebSocket connected: clientId={clientId}")
        while True:
            try:
                data = await websocket.receive_text()
                logger.log(f"WebSocket received from {clientId}: {data}")
                # --- Place for custom message handling logic ---
                # For now, just echo the message back
                await websocket.send_text(f"Echo: {data}")
            except WebSocketDisconnect:
                logger.log(f"WebSocket disconnected: clientId={clientId}")
                break  # Exit the loop cleanly on disconnect
            except Exception as e:
                logger.log(f"WebSocket error (clientId={clientId}): {e}")
                # Only attempt to close if not already closed
                try:
                    await websocket.close(code=1011)
                except RuntimeError:
                    pass  # Already closed
                break
    except Exception as e:
        logger.log(f"WebSocket connection error (clientId={clientId}): {e}")
        # Only attempt to close if not already closed
        try:
            await websocket.close(code=1011)
        except RuntimeError:
            pass  # Already closed
