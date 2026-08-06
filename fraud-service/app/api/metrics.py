from fastapi import APIRouter
from app.schemas.metrics import MetricsResponse
from app.services.metrics_tracker import metrics_tracker

router = APIRouter()

@router.get("/metrics", response_model=MetricsResponse)
def get_metrics():
    return MetricsResponse(
        events_received=metrics_tracker.events_received,
        fraud_detected=metrics_tracker.fraud_detected,
        low_risk=metrics_tracker.low_risk,
        medium_risk=metrics_tracker.medium_risk,
        high_risk=metrics_tracker.high_risk
    )
