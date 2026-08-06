from pydantic import BaseModel

class MetricsResponse(BaseModel):
    events_received: int
    events_saved: int
    events_failed: int
    duplicate_events: int
