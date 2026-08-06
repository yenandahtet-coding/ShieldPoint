from pydantic import BaseModel

class MetricsResponse(BaseModel):
    events_received: int
    fraud_detected: int
    low_risk: int
    medium_risk: int
    high_risk: int
