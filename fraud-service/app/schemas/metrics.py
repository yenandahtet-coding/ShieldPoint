from pydantic import BaseModel
from typing import List, Dict, Any

class MetricsResponse(BaseModel):
    events_received: int
    fraud_detected: int
    low_risk: int
    medium_risk: int
    high_risk: int
    risk_distribution: List[Dict[str, Any]] = []
    fraud_trend: List[Dict[str, Any]] = []
    by_country: List[Dict[str, Any]] = []
