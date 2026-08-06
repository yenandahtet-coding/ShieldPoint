from pydantic import BaseModel

class HealthResponse(BaseModel):
    service: str
    status: str
    kafka: str
    mongodb: str
    version: str
