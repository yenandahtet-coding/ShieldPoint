from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime, timezone
from app.config.settings import settings

class BaseEvent(BaseModel):
    eventId: UUID = Field(default_factory=uuid4)
    eventVersion: str = "1.0"
    eventType: str
    correlationId: UUID
    source: str = "fraud-service"
    environment: str = settings.ENVIRONMENT
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processingStatus: str = "PENDING"

class TransactionPayload(BaseModel):
    transactionId: UUID
    senderId: str
    receiverPhone: Optional[str] = None
    merchantId: Optional[str] = None
    amount: float
    note: Optional[str] = None

class TransactionCreatedEvent(BaseEvent):
    # Overriding to allow incoming source from api-service
    source: str
    payload: TransactionPayload

class FraudDetectedPayload(BaseModel):
    transactionId: UUID
    senderId: str
    riskScore: int
    riskLevel: str
    triggeredRules: List[str]

class FraudDetectedEvent(BaseEvent):
    eventType: str = "FRAUD_DETECTED"
    payload: FraudDetectedPayload
