from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.config.logging_config import setup_logging
from app.api import health, metrics
from app.consumer import consumer_worker
import logging

setup_logging()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Service Started")
    consumer_worker.start()
    yield
    logger.info("Shutting down...")
    consumer_worker.stop()

app = FastAPI(title="Nova Pay Logger Service", lifespan=lifespan)

app.include_router(health.router)
app.include_router(metrics.router)
