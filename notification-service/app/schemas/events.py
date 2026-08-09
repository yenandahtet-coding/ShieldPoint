from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime

class BaseEvent(BaseModel):
    eventId: UUID
    eventVersion: str
    eventType: str
    correlationId: UUID
    source: str
    environment: str
    timestamp: datetime
    processingStatus: str

class FraudDetectedPayload(BaseModel):
    transactionId: UUID
    senderId: str
    riskScore: int
    riskLevel: str
    triggeredRules: List[str]

class FraudDetectedEvent(BaseEvent):
    payload: FraudDetectedPayload
