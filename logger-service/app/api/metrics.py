from fastapi import APIRouter
from app.schemas.metrics import MetricsResponse
from app.services.metrics_tracker import metrics_tracker

router = APIRouter()

@router.get("/metrics", response_model=MetricsResponse)
def get_metrics():
    return MetricsResponse(
        events_received=metrics_tracker.events_received,
        events_saved=metrics_tracker.events_saved,
        events_failed=metrics_tracker.events_failed,
        duplicate_events=metrics_tracker.duplicate_events
    )
