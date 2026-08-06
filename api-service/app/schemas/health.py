from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    kafka_status: str
