from sqlalchemy import Column, String, Float, DateTime, Float
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
from app.models.database import Base

class TransactionRecord(Base):
    __tablename__ = "transactions"

    transaction_id = Column(UUID(as_uuid=True), primary_key=True, index=True)
    sender_id = Column(String, nullable=False, index=True)
    receiver_phone = Column(String, nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="MMK")
    note = Column(String, nullable=True)
    
    # Tracking fields
    status = Column(String, default="ACCEPTED")
    processing_status = Column(String, default="PENDING")
    
    event_id = Column(UUID(as_uuid=True), unique=True, nullable=False)
    correlation_id = Column(UUID(as_uuid=True), nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
