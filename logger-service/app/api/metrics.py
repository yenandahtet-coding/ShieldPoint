from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from app.schemas.metrics import MetricsResponse
from app.services.metrics_tracker import metrics_tracker
from app.models.database import get_db
from app.models.models import TransactionRecord

router = APIRouter()

@router.get("/metrics", response_model=MetricsResponse)
def get_metrics(db: Session = Depends(get_db)):
    # Total historical transactions
    total_tx = db.query(TransactionRecord).count()
    
    # Transactions per minute (last 60 mins)
    sixty_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=60)
    minute_counts = db.query(
        func.date_trunc('minute', TransactionRecord.created_at).label('t'),
        func.count().label('transactions')
    ).filter(TransactionRecord.created_at >= sixty_mins_ago).group_by('t').order_by('t').all()
    
    per_minute = []
    for row in minute_counts:
        t_val = row[0]
        tx_count = row[1]
        time_str = t_val.strftime("%H:%M") if hasattr(t_val, 'strftime') else str(t_val)
        per_minute.append({"t": time_str, "transactions": tx_count})
    
    # Hourly transactions (last 24 hours)
    twenty_four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=24)
    hour_counts = db.query(
        func.date_trunc('hour', TransactionRecord.created_at).label('hour'),
        func.count().label('volume')
    ).filter(TransactionRecord.created_at >= twenty_four_hours_ago).group_by('hour').order_by('hour').all()
    
    hourly = []
    for row in hour_counts:
        h_val = row[0]
        vol = row[1]
        hour_str = h_val.strftime("%H:00") if hasattr(h_val, 'strftime') else str(h_val)
        hourly.append({"hour": hour_str, "volume": vol})

    return MetricsResponse(
        events_received=metrics_tracker.events_received,
        events_saved=metrics_tracker.events_saved,
        events_failed=metrics_tracker.events_failed,
        duplicate_events=metrics_tracker.duplicate_events,
        total_transactions=total_tx,
        per_minute=per_minute,
        hourly=hourly
    )
