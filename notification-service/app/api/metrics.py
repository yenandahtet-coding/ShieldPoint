from fastapi import APIRouter
from app.services.notification import NotificationService

router = APIRouter()

@router.get("/metrics")
def get_metrics():
    return NotificationService.get_metrics()

@router.get("/history")
def get_history():
    return {"history": NotificationService.get_history()}
