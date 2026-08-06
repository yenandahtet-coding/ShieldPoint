import json
import logging
from confluent_kafka import Producer
from app.config.settings import settings

logger = logging.getLogger(__name__)

try:
    producer = Producer({
        'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS
    })
except Exception as e:
    logger.error(f"Failed to initialize Kafka Producer: {e}")
    producer = None

def delivery_report(err, msg):
    if err is not None:
        logger.error(f'Message delivery failed: {err}')
    else:
        logger.info(f'Alert delivered to {msg.topic()} [{msg.partition()}]')

def publish_fraud_alert(topic: str, key: str, value_json: str):
    if not producer:
        logger.warning(f"Kafka producer not initialized. Cannot publish event to {topic}")
        return
        
    try:
        producer.poll(0)
        producer.produce(
            topic=topic,
            key=key.encode('utf-8') if key else None,
            value=value_json.encode('utf-8'),
            callback=delivery_report
        )
    except Exception as e:
        logger.error(f"Exception while publishing to Kafka: {e}")
