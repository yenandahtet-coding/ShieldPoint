import logging
import time
import threading
from confluent_kafka import Consumer, KafkaError, KafkaException
from app.config.settings import settings
from app.models.database import SessionLocal
from app.services.event_handler import EventHandler

logger = logging.getLogger(__name__)

class KafkaConsumerWorker:
    def __init__(self):
        self.conf = {
            'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
            'group.id': settings.CONSUMER_GROUP_ID,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': False  # Explicit offset management
        }
        self.consumer = None
        self.running = False
        self.is_connected = False

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._consume_loop)
        self.thread.daemon = True
        self.thread.start()

    def stop(self):
        self.running = False
        if self.consumer:
            self.consumer.close()

    def get_status(self) -> str:
        return "CONNECTED" if self.is_connected else "DISCONNECTED"

    def _consume_loop(self):
        try:
            self.consumer = Consumer(self.conf)
            self.consumer.subscribe(['transactions', 'fraud-alerts'])
            self.is_connected = True
            logger.info("Kafka Connected. Listening to 'transactions'...")
            
            while self.running:
                # Poll for messages
                msg = self.consumer.poll(timeout=1.0)
                
                if msg is None:
                    continue
                    
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        # End of partition
                        continue
                    else:
                        logger.error(f"Kafka error: {msg.error()}")
                        if "UNKNOWN_TOPIC_OR_PART" in str(msg.error()):
                            time.sleep(2)
                            continue
                        self.is_connected = False
                        break
                
                # Message received
                self.is_connected = True
                success = False
                retry_attempts = 0
                max_retries = 3
                
                while not success and self.running:
                    try:
                        with SessionLocal() as db_session:
                            handler = EventHandler(db_session)
                            success = handler.handle_transaction_event(msg.value())
                            
                            if success:
                                # Commit offset manually only after successful persistence or graceful ignore
                                self.consumer.commit(asynchronous=False)
                                break
                            else:
                                # DB temporary failure, retry strategy
                                retry_attempts += 1
                                logger.warning(f"Retry Attempt {retry_attempts} for message offset {msg.offset()}")
                                time.sleep(2 ** retry_attempts) # Exponential backoff
                                
                    except Exception as e:
                        logger.error(f"Fatal error processing message: {e}")
                        retry_attempts += 1
                        time.sleep(2 ** retry_attempts)
                        
        except KafkaException as e:
            logger.error(f"KafkaException: {e}")
            self.is_connected = False
        finally:
            if self.consumer:
                self.consumer.close()
                logger.info("Kafka Consumer closed.")

consumer_worker = KafkaConsumerWorker()
