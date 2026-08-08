import logging
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from app.models.models import TransactionRecord
from app.schemas.events import TransactionCreatedEvent
from sqlalchemy.exc import IntegrityError

logger = logging.getLogger(__name__)

class TransactionRepository:
    def __init__(self, db: Session):
        self.db = db

    def save_transaction(self, event: TransactionCreatedEvent) -> bool:
        """
        Saves transaction to PostgreSQL.
        Returns True if saved, False if it was a duplicate.
        Raises exception on DB failure.
        """
        payload = event.payload
        
        stmt = insert(TransactionRecord).values(
            transaction_id=payload.transactionId,
            sender_id=payload.senderId,
            receiver_phone=payload.receiverPhone,
            amount=payload.amount,
            note=payload.note,
            event_id=event.eventId,
            correlation_id=event.correlationId,
            status="ACCEPTED",
            processing_status=event.processingStatus,
        ).on_conflict_do_nothing(index_elements=['transaction_id'])
        
        try:
            from sqlalchemy import text
            result = self.db.execute(stmt)
            if result.rowcount > 0:
                self.db.execute(text("UPDATE profiles SET balance = balance - :a WHERE id = :u"), {"a": payload.amount, "u": payload.senderId})
                self.db.commit()
                logger.info(f"Transaction Saved and Balance Deducted: {payload.transactionId}")
                return True
            else:
                self.db.commit()
                logger.info(f"Duplicate transaction ignored: {payload.transactionId}")
                return False
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error saving transaction: {e}")
            raise
