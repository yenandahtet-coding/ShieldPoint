from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.models import NotificationRecord
from pydantic import BaseModel
from typing import List

router = APIRouter()

class NotificationHistoryItem(BaseModel):
    notificationId: str
    eventId: str
    transactionId: str
    status: str
    timestamp: str

class NotificationHistoryResponse(BaseModel):
    history: List[NotificationHistoryItem]
    debug_db: str = ""

@router.get("/history", response_model=NotificationHistoryResponse)
def get_history(db: Session = Depends(get_db)):
    records = db.query(NotificationRecord).order_by(NotificationRecord.created_at.desc()).limit(100).all()
    history = [
        NotificationHistoryItem(
            notificationId=r.notification_id,
            eventId=r.event_id,
            transactionId=r.transaction_id,
            status=r.status,
            timestamp=r.created_at.isoformat() if r.created_at else ""
        )
        for r in records
    ]
    db_url = str(db.bind.url) if db.bind else "no_bind"
    return NotificationHistoryResponse(history=history, debug_db=db_url)
