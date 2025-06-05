from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..schemas.model import SavedModel, SavedModelCreate

class ModelService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["saved_models"]

    async def save_model(self, data: SavedModelCreate) -> SavedModel:
        document = data.model_dump()
        document.update({"created_at": datetime.utcnow(), "updated_at": datetime.utcnow()})
        res = await self.collection.insert_one(document)
        document["_id"] = res.inserted_id
        return SavedModel(**document)

    async def list_models(self, limit: int = 100) -> list[SavedModel]:
        cursor = self.collection.find().sort("created_at", -1).limit(limit)
        return [SavedModel(**doc) async for doc in cursor]

    async def get_model(self, model_id: ObjectId) -> SavedModel | None:
        doc = await self.collection.find_one({"_id": model_id})
        return SavedModel(**doc) if doc else None

    async def delete_model(self, model_id: ObjectId) -> bool:
        res = await self.collection.delete_one({"_id": model_id})
        return res.deleted_count == 1
