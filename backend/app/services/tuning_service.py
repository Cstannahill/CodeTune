from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from ..schemas.tuning import TuningCreate, Tuning, TuningProgress


class TuningService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["tuning_tasks"]

    async def create_task(self, data: TuningCreate) -> Tuning:
        document = data.model_dump()
        document.update(
            {
                "status": "queued",
                "progress": 0.0,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        )
        result = await self.collection.insert_one(document)
        document["_id"] = result.inserted_id
        return Tuning(**document)

    async def get_task(self, task_id: ObjectId) -> Tuning | None:
        doc = await self.collection.find_one({"_id": task_id})
        return Tuning(**doc) if doc else None

    async def update_progress(
        self,
        task_id: ObjectId,
        progress: float,
        status: str,
        result: dict | None = None,
    ) -> TuningProgress:
        update = {
            "$set": {
                "progress": progress,
                "status": status,
                "updated_at": datetime.utcnow(),
            }
        }
        if result is not None:
            update["$set"]["result"] = result
        await self.collection.update_one({"_id": task_id}, update)
        doc = await self.collection.find_one({"_id": task_id})
        if not doc:
            raise ValueError(f"Tuning task with id {task_id} not found.")
        return TuningProgress(
            task_id=str(doc["_id"]),
            progress=doc["progress"],
            status=doc["status"],
            result=doc.get("result"),
            updated_at=doc.get("updated_at"),
        )

    async def list_tasks(self, limit: int = 100) -> list[Tuning]:
        cursor = self.collection.find().sort("created_at", -1).limit(limit)
        return [Tuning(**doc) async for doc in cursor]
