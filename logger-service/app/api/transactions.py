from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.models import TransactionRecord
from typing import List

router = APIRouter()

@router.get("/transactions")
def get_transactions(
    page: int = Query(1, ge=1), 
    limit: int = Query(50, ge=1, le=100), 
    db: Session = Depends(get_db)
):
    offset = (page - 1) * limit
    transactions = db.query(TransactionRecord).order_by(TransactionRecord.created_at.desc()).offset(offset).limit(limit).all()
    return [
        {
            "transaction_id": str(t.transaction_id),
            "sender_id": t.sender_id,
            "receiver_phone": t.receiver_phone,
            "amount": t.amount,
            "currency": t.currency,
            "note": t.note,
            "status": t.status,
            "processing_status": t.processing_status,
            "event_id": str(t.event_id),
            "correlation_id": str(t.correlation_id),
            "created_at": t.created_at.isoformat() if t.created_at else None
        }
        for t in transactions
    ]

@router.get("/transactions/{transaction_id}")
def get_transaction(transaction_id: str, db: Session = Depends(get_db)):
    t = db.query(TransactionRecord).filter(TransactionRecord.transaction_id == transaction_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {
        "transaction_id": str(t.transaction_id),
        "sender_id": t.sender_id,
        "receiver_phone": t.receiver_phone,
        "amount": t.amount,
        "currency": t.currency,
        "note": t.note,
        "status": t.status,
        "processing_status": t.processing_status,
        "event_id": str(t.event_id),
        "correlation_id": str(t.correlation_id),
        "created_at": t.created_at.isoformat() if t.created_at else None
    }
