from fastapi import APIRouter
from app.schemas.health import HealthResponse
from app.consumer import consumer_worker
from sqlalchemy import text
from app.models.database import SessionLocal

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health_check():
    # Check DB Connection
    db_status = "DISCONNECTED"
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
            db_status = "CONNECTED"
    except Exception:
        pass
        
    return HealthResponse(
        service="logger-service",
        version="1.0.0",
        status="UP",
        kafka=consumer_worker.get_status(),
        database=db_status
    )
