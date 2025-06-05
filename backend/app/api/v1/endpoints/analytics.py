from fastapi import APIRouter, Depends
from ....core.database import db

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/")
async def get_analytics():
    # Placeholder for actual analytics from tuning tasks
    collection = db["tuning_tasks"]
    count = await collection.count_documents({})
    average_progress = await collection.aggregate([
        {"$group": {"_id": None, "avg": {"$avg": "$progress"}}}
    ]).to_list(1)
    average = average_progress[0]["avg"] if average_progress else 0
    return {"total_tasks": count, "average_progress": average}
