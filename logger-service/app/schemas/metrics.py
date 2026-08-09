from pydantic import BaseModel
from typing import List, Dict, Any

class MetricsResponse(BaseModel):
    events_received: int
    events_saved: int
    events_failed: int
    duplicate_events: int
    total_transactions: int = 0
    per_minute: List[Dict[str, Any]] = []
    hourly: List[Dict[str, Any]] = []
