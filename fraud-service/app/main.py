from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.config.logging_config import setup_logging
from app.api import health, metrics
from app.consumer import consumer_worker
from app.mongodb.database import db_client
import logging

setup_logging()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Service Started")
    # Initialize MongoDB Client
    db_client.connect()
    # Start Kafka Consumer Thread
    consumer_worker.start()
    yield
    logger.info("Shutting down...")
    consumer_worker.stop()
    db_client.close()

app = FastAPI(title="Nova Pay Fraud Service", lifespan=lifespan)

app.include_router(health.router)
app.include_router(metrics.router)
