import json
import logging
from confluent_kafka import Producer
from app.config.settings import settings

logger = logging.getLogger(__name__)

# Initialize Producer configuration
# We use a singleton-like pattern for the producer instance
try:
    producer = Producer({
        'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
        # 'client.id': settings.PROJECT_NAME,
        # Additional settings like acks, retries can go here
    })
except Exception as e:
    logger.error(f"Failed to initialize Kafka Producer: {e}")
    producer = None

def delivery_report(err, msg):
    """ Called once for each message produced to indicate delivery result.
        Triggered by poll() or flush(). """
    if err is not None:
        logger.error(f'Message delivery failed: {err}')
    else:
        logger.info(f'Message delivered to {msg.topic()} [{msg.partition()}]')

def publish_event(topic: str, key: str, value: dict):
    if not producer:
        logger.warning(f"Kafka producer not initialized. Cannot publish event to {topic}")
        return
        
    try:
        # Trigger any available delivery report callbacks from previous produce() calls
        producer.poll(0)
        
        # Asynchronously produce a message. The delivery report callback will
        # be triggered from poll() above, or flush() below, when the message has
        # been successfully delivered or failed permanently.
        producer.produce(
            topic=topic,
            key=key.encode('utf-8') if key else None,
            value=value.encode('utf-8') if isinstance(value, str) else json.dumps(value).encode('utf-8'),
            callback=delivery_report
        )
    except Exception as e:
        logger.error(f"Exception while publishing to Kafka: {e}")

def get_producer_status() -> bool:
    """Returns True if the producer was successfully initialized."""
    return producer is not None
