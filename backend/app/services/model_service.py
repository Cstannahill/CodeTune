from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
import os
import json

from ..schemas.model import SavedModel, SavedModelCreate
from app.services.hf_model_io import HFModelIO


class ModelService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["saved_models"]
        self.settings_file = os.environ.get("CODETUNE_SETTINGS_FILE", "settings.json")

    async def save_model(
        self, data: SavedModelCreate, model_dir: str, push_to_hf: bool = False
    ) -> SavedModel:
        document = data.model_dump()
        document.update(
            {"created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
        )
        # Save model locally
        local_path = self.save_model_locally(model_dir, document)
        document["local_path"] = local_path
        # Optionally push to HuggingFace
        if push_to_hf:
            settings = self._load_settings()
            hf_token = settings.get("hf_token")
            hf_user = settings.get("hf_user")
            if not hf_token or not hf_user:
                raise ValueError(
                    "HuggingFace token and user/org must be set in settings to push to HuggingFace."
                )
            hf = HFModelIO(str(hf_token), str(hf_user))
            repo_id = hf.push_model(local_path, document["name"])
            document["hf_repo_id"] = repo_id
        res = await self.collection.insert_one(document)
        document["_id"] = res.inserted_id
        return SavedModel(**document)

    def save_model_locally(self, model_dir: str, document: dict) -> str:
        # This is a placeholder for actual model saving logic
        # For now, just create a dummy file
        os.makedirs(model_dir, exist_ok=True)
        model_path = os.path.join(
            model_dir, f"{document['name'] or document['_id']}.bin"
        )
        with open(model_path, "wb") as f:
            f.write(b"FAKE_MODEL_DATA")
        return model_path

    def _load_settings(self):
        if os.path.exists(self.settings_file):
            with open(self.settings_file, "r") as f:
                return json.load(f)
        return {}

    async def list_models(self, limit: int = 100) -> list[SavedModel]:
        cursor = self.collection.find().sort("created_at", -1).limit(limit)
        return [SavedModel(**doc) async for doc in cursor]

    async def get_model(self, model_id: ObjectId) -> SavedModel | None:
        doc = await self.collection.find_one({"_id": model_id})
        return SavedModel(**doc) if doc else None

    async def delete_model(self, model_id: ObjectId) -> bool:
        res = await self.collection.delete_one({"_id": model_id})
        return res.deleted_count == 1
