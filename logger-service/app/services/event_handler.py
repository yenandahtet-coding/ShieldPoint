import logging
import json
from pydantic import ValidationError
from app.schemas.events import TransactionCreatedEvent
from app.repositories.transaction_repository import TransactionRepository
from app.services.metrics_tracker import metrics_tracker
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class EventHandler:
    def __init__(self, db_session: Session):
        self.repository = TransactionRepository(db_session)

    def handle_transaction_event(self, message_value: bytes) -> bool:
        """
        Parses, validates, and persists a transaction event.
        Returns True if successful (or duplicate/malformed so we can commit offset),
        Returns False if a temporary error occurred (like DB down) so we do not commit offset.
        """
        metrics_tracker.events_received += 1
        
        try:
            # Parse JSON
            data = json.loads(message_value.decode('utf-8'))
            logger.info("Event Received")
            
            event_type = data.get("eventType")
            
            if event_type == "FRAUD_DETECTED":
                transaction_id = data.get("payload", {}).get("transactionId")
                if transaction_id:
                    self.repository.update_status(transaction_id, "DECLINED") # Changed from FLAGGED to DECLINED per UI image 1 which shows ACCEPTED/DECLINED
                return True
                
            # Validate Event
            event = TransactionCreatedEvent(**data)
            
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding JSON event: {e}. Message: {message_value}")
            metrics_tracker.events_failed += 1
            return True # Committing offset because it's permanently malformed
            
        except ValidationError as e:
            logger.error(f"Event Validation Error: {e.errors()} for payload: {data}")
            metrics_tracker.events_failed += 1
            return True # Committing offset because it's permanently malformed
            
        except Exception as e:
            logger.error(f"Unexpected error validating event: {e}")
            metrics_tracker.events_failed += 1
            return True 
            
        # Try to persist
        try:
            saved = self.repository.save_transaction(event)
            if saved:
                metrics_tracker.events_saved += 1
            else:
                metrics_tracker.duplicate_events += 1
            return True
        except Exception as e:
            logger.error(f"Database error persisting transaction {event.payload.transactionId}: {e}")
            # Do NOT commit offset, so Kafka can redeliver
            # A background retry loop in consumer will wait and re-poll this
            return False
