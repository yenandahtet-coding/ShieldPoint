from fastapi import APIRouter
from app.config.settings import settings
import socket

router = APIRouter()

@router.get("/health")
def health_check():
    # Simple TCP check to see if Kafka broker is reachable
    kafka_host, kafka_port = settings.KAFKA_BOOTSTRAP_SERVERS.split(":")
    kafka_status = "DISCONNECTED"
    
    try:
        with socket.create_connection((kafka_host, int(kafka_port)), timeout=2):
            kafka_status = "CONNECTED"
    except OSError:
        kafka_status = "DISCONNECTED"

    return {
        "service": "notification-service",
        "version": "1.0.0",
        "status": "UP",
        "kafka": kafka_status
    }
