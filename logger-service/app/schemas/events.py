from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
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

class TransactionPayload(BaseModel):
    transactionId: UUID
    senderId: str
    receiverPhone: Optional[str] = None
    merchantId: Optional[str] = None
    amount: float
    note: Optional[str] = None
    country: Optional[str] = None

class TransactionCreatedEvent(BaseEvent):
    payload: TransactionPayload
