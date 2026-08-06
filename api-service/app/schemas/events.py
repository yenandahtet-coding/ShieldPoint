from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime, timezone
from app.config.settings import settings

class BaseEvent(BaseModel):
    eventId: UUID = Field(default_factory=uuid4)
    eventVersion: str = "1.0"
    eventType: str
    correlationId: UUID
    source: str = "api-service"
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
    payload: TransactionPayload
