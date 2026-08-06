from fastapi import APIRouter
from app.schemas.health import HealthResponse
from app.consumer import consumer_worker
from app.mongodb.database import db_client
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    db_status = "DISCONNECTED"
    if db_client.client:
        try:
            # Ping MongoDB
            await db_client.client.admin.command('ping')
            db_status = "CONNECTED"
        except Exception as e:
            logger.error(f"MongoDB health check failed: {e}")
            
    return HealthResponse(
        service="fraud-service",
        version="1.0.0",
        status="UP",
        kafka=consumer_worker.get_status(),
        mongodb=db_status
    )
