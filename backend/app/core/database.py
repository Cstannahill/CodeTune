from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

class Database:
    client: AsyncIOMotorClient | None = None

    @classmethod
    def get_client(cls) -> AsyncIOMotorClient:
        if not cls.client:
            cls.client = AsyncIOMotorClient(settings.mongodb_uri)
        return cls.client

    @classmethod
    def get_db(cls):
        return cls.get_client()[settings.mongodb_db]

db = Database.get_db()
