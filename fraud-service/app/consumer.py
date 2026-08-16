import logging
import time
import asyncio
import threading
from confluent_kafka import Consumer, KafkaError, KafkaException
from app.config.settings import settings
from app.services.event_handler import EventHandler

logger = logging.getLogger(__name__)

class KafkaConsumerWorker:
    def __init__(self):
        self.conf = {
            'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
            'group.id': settings.CONSUMER_GROUP_ID,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': False
        }
        self.consumer = None
        self.running = False
        self.is_connected = False
        self.handler = None

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._run_async_loop)
        self.thread.daemon = True
        self.thread.start()

    def stop(self):
        self.running = False
        if self.consumer:
            self.consumer.close()

    def get_status(self) -> str:
        return "CONNECTED" if self.is_connected else "DISCONNECTED"

    def _run_async_loop(self):
        # Create a new event loop for this thread to support async MongoDB operations
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(self._consume_loop())
        finally:
            loop.close()

    async def _consume_loop(self):
        try:
            self.handler = EventHandler()
            self.consumer = Consumer(self.conf)
            self.consumer.subscribe(['transactions'])
            self.is_connected = True
            logger.info("Kafka Connected. Fraud Service listening to 'transactions'...")
            
            while self.running:
                # Need to use a short timeout and `asyncio.sleep` to allow event loop to breathe
                msg = self.consumer.poll(timeout=0.1)
                
                if msg is None:
                    await asyncio.sleep(0.1)
                    continue
                    
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    else:
                        logger.error(f"Kafka error: {msg.error()}")
                        self.is_connected = False
                        break
                
                self.is_connected = True
                success = False
                retry_attempts = 0
                
                while not success and self.running:
                    try:
                        success = await self.handler.handle_transaction_event(msg.value())
                        
                        if success:
                            self.consumer.commit(asynchronous=False)
                            break
                        else:
                            retry_attempts += 1
                            logger.warning(f"Retry Attempt {retry_attempts} for offset {msg.offset()}")
                            await asyncio.sleep(2 ** retry_attempts)
                            
                    except Exception as e:
                        logger.error(f"Fatal error processing message: {e}")
                        retry_attempts += 1
                        await asyncio.sleep(2 ** retry_attempts)
                        
        except KafkaException as e:
            logger.error(f"KafkaException: {e}")
            self.is_connected = False
        finally:
            if self.consumer:
                self.consumer.close()
                logger.info("Kafka Consumer closed.")

consumer_worker = KafkaConsumerWorker()
