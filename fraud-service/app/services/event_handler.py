import logging
import json
import uuid
from datetime import datetime, timezone
from pydantic import ValidationError
from app.schemas.events import TransactionCreatedEvent, FraudDetectedEvent, FraudDetectedPayload
from app.rules.rule_engine import rule_engine
from app.repositories.fraud_repository import FraudRepository
from app.services.metrics_tracker import metrics_tracker
from app.producer import publish_fraud_alert
from app.config.topics import KafkaTopics

logger = logging.getLogger(__name__)

class EventHandler:
    def __init__(self, custom_client=None):
        self.repository = FraudRepository(custom_client)

    async def handle_transaction_event(self, message_value: bytes):
        """
        Parses the transaction, runs it through the rule engine,
        saves to MongoDB if suspicious, and publishes fraud-alerts.
        Returns True if successfully processed (so offset can be committed).
        """
        metrics_tracker.events_received += 1
        
        try:
            data = json.loads(message_value.decode('utf-8'))
            event = TransactionCreatedEvent(**data)
        except (json.JSONDecodeError, ValidationError) as e:
            logger.error(f"Malformed event received: {e}")
            # Ignore gracefully and move on
            return True
            
        except Exception as e:
            logger.error(f"Unexpected error parsing event: {e}")
            return True
            
        # Run through rule engine
        risk_score, risk_level, triggered_rules = rule_engine.analyze(event)
        
        if risk_level == "LOW":
            metrics_tracker.low_risk += 1
            return True # Ignore and do not store
            
        # If we reach here, it's MEDIUM or HIGH risk
        metrics_tracker.fraud_detected += 1
        if risk_level == "MEDIUM":
            metrics_tracker.medium_risk += 1
        else:
            metrics_tracker.high_risk += 1
            
        logger.warning(f"Fraud Detected! Tx: {event.payload.transactionId}, Score: {risk_score}, Level: {risk_level}")
        
        # 1. Build Fraud Report document for MongoDB
        fraud_id = str(uuid.uuid4())
        fraud_document = {
            "fraud_id": fraud_id,
            "transaction_id": str(event.payload.transactionId),
            "sender_id": event.payload.senderId,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "triggered_rules": triggered_rules,
            "timestamp": datetime.now(timezone.utc),
            "correlation_id": str(event.correlationId)
        }
        
        # 2. Build Kafka Event for fraud-alerts
        alert_payload = FraudDetectedPayload(
            transactionId=event.payload.transactionId,
            senderId=event.payload.senderId,
            riskScore=risk_score,
            riskLevel=risk_level,
            triggeredRules=triggered_rules
        )
        
        alert_event = FraudDetectedEvent(
            correlationId=event.correlationId,
            payload=alert_payload
        )
        
        # 3. Execute persistence and publishing
        try:
            # Note: motor is async, so we must await the repository save
            await self.repository.save_fraud_report(fraud_document)
            
            # Publish to Kafka
            publish_fraud_alert(
                topic=KafkaTopics.FRAUD_ALERTS,
                key=str(event.payload.transactionId),
                value_json=alert_event.model_dump_json()
            )
            return True
            
        except Exception as e:
            logger.error(f"Failed to process fraud alert persistence: {e}")
            # Do NOT commit offset, let Kafka redeliver
            return False
