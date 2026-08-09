import json
import logging
import time
from confluent_kafka import Consumer, KafkaError
from pydantic import ValidationError

from app.config.settings import settings
from app.schemas.events import FraudDetectedEvent
from app.services.notification import NotificationService

logger = logging.getLogger(__name__)

class NotificationConsumer:
    def __init__(self):
        self.conf = {
            'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
            'group.id': settings.CONSUMER_GROUP_ID,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': False
        }
        self.consumer = Consumer(self.conf)
        self.running = False
        self.notification_service = NotificationService()

    def start(self):
        self.consumer.subscribe(['fraud-alerts'])
        self.running = True
        logger.info(f"Kafka Connected. Notification Service listening to 'fraud-alerts'...")
        
        while self.running:
            msg = self.consumer.poll(timeout=1.0)
            if msg is None:
                continue

            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    logger.error(f"Consumer error: {msg.error()}")
                    continue

            # Process Message
            try:
                payload = json.loads(msg.value().decode('utf-8'))
                
                # Strict Pydantic validation
                event = FraudDetectedEvent(**payload)
                
                # Dispatch notification
                self.notification_service.process_alert(event)
                
                # Insert into DB
                from app.models.database import SessionLocal
                from app.models.models import NotificationRecord
                import uuid
                
                db = SessionLocal()
                try:
                    record = NotificationRecord(
                        notification_id=str(uuid.uuid4()),
                        event_id=str(event.eventId),
                        transaction_id=str(event.payload.transactionId),
                        status="SENT"
                    )
                    db.add(record)
                    db.commit()
                except Exception as db_e:
                    logger.error(f"Failed to save notification record: {db_e}")
                    db.rollback()
                finally:
                    db.close()
                
                # Commit offset only after successful processing
                self.consumer.commit(asynchronous=False)
                
            except ValidationError as e:
                logger.error(f"Malformed event received, dropping message. Validation error: {e}")
                self.consumer.commit(asynchronous=False) # Commit to skip poison pill
            except json.JSONDecodeError:
                logger.error("Failed to decode JSON from Kafka message, dropping.")
                self.consumer.commit(asynchronous=False)
            except Exception as e:
                logger.error(f"Unexpected error processing message: {str(e)}")
                # We do NOT commit the offset here so it can be retried
                time.sleep(1) # Prevent tight loop on continuous failure

    def stop(self):
        self.running = False
        self.consumer.close()
        logger.info("Notification Consumer stopped.")
