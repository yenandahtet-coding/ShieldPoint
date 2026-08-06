from fastapi import APIRouter
from app.schemas.health import HealthResponse
from app.utils.kafka_producer import get_producer_status

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health_check():
    kafka_connected = get_producer_status()
    return HealthResponse(
        status="OK", 
        service="api-service",
        version="1.0.0",
        kafka_status="connected" if kafka_connected else "disconnected"
    )
