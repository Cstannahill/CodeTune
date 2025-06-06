import asyncio
import logging
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from .tuning_service import TuningService
from rich.progress import Progress, BarColumn, TextColumn, TimeElapsedColumn

logger = logging.getLogger("tuning_worker")


class TuningWorker:
    def __init__(self, db: AsyncIOMotorDatabase, poll_interval: float = 2.0):
        self.db = db
        self.service = TuningService(db)
        self.poll_interval = poll_interval
        self._running = False
        logger.info("TuningWorker initialized (not started)")

    async def run(self):
        self._running = True
        logger.info("TuningWorker started.")
        while self._running:
            try:
                await self.process_queued_tasks()
            except Exception as e:
                logger.error(f"Worker error: {e}")
            await asyncio.sleep(self.poll_interval)

    async def process_queued_tasks(self):
        # Find all queued tasks
        cursor = self.service.collection.find({"status": "queued"})
        async for doc in cursor:
            task_id = doc["_id"]
            logger.info(f"Starting tuning for task {task_id}")
            await self.run_tuning_task(task_id, doc)

    async def run_tuning_task(self, task_id: ObjectId, doc: dict):
        try:
            await self.service.update_progress(task_id, 0.01, "running")
            total_steps = (
                doc["parameters"].get("trainingSteps")
                or doc["parameters"].get("epochs")
                or 10
            )
            pct = 0.0
            with Progress(
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                "{task.percentage:>3.0f}%",
                TimeElapsedColumn(),
                transient=True,
            ) as progress:
                task = progress.add_task(f"Tuning {task_id}", total=total_steps)
                for step in range(1, total_steps + 1):
                    await asyncio.sleep(0.5)
                    pct = step / total_steps
                    await self.service.update_progress(task_id, pct, "running")
                    progress.update(task, advance=1)
            result = {"loss": round(0.05 + 0.1 * (0.5 - pct), 4)}
            await self.service.update_progress(task_id, 1.0, "completed", result=result)
            logger.info(f"Completed tuning for task {task_id}")
        except Exception as e:
            logger.error(f"Tuning failed for task {task_id}: {e}")
            await self.service.update_progress(
                task_id, 1.0, "failed", result={"error": str(e)}
            )


# Usage example (to be run in an async context, e.g. FastAPI startup):
# from app.core.database import db
# worker = TuningWorker(db)
# asyncio.create_task(worker.run())
