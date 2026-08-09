import logging
import time
from app.consumer import consumer_worker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    logger.info("Starting Wallet Service...")
    consumer_worker.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down Wallet Service...")
        consumer_worker.stop()

if __name__ == "__main__":
    main()
