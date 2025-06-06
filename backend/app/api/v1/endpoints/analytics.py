from fastapi import APIRouter, Depends
from ....core.database import db
from ....core.logger import logger  # new import

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/")
async def get_analytics():
    logger.log("Fetching analytics data...")
    collection = db["tuning_tasks"]
    count = await collection.count_documents({})
    average_progress = await collection.aggregate(
        [{"$group": {"_id": None, "avg": {"$avg": "$progress"}}}]
    ).to_list(1)
    average = average_progress[0]["avg"] if average_progress else 0
    # Display metrics in a table
    logger.table(
        title="Analytics Metrics",
        columns=["Metric", "Value"],
        rows=[["total_tasks", count], ["average_progress", round(average, 2)]],
    )
    return {"total_tasks": count, "average_progress": average}
