from sqlalchemy import Column, String, DateTime
from app.models.database import Base
from datetime import datetime, timezone

class NotificationRecord(Base):
    __tablename__ = "notifications"

    notification_id = Column(String, primary_key=True, index=True)
    event_id = Column(String, index=True)
    transaction_id = Column(String, index=True)
    status = Column(String, default="SENT")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
