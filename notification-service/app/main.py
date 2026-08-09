import threading
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.logging_config import setup_logging
from app.api.health import router as health_router
from app.api.metrics import router as metrics_router
from app.api.history import router as history_router
from app.consumer import NotificationConsumer
from app.models.database import engine
from app.models.models import Base

# Initialize standard logging
setup_logging()
logger = logging.getLogger(__name__)

# Create SQLite tables
Base.metadata.create_all(bind=engine)

# Global consumer instance
consumer_instance = None
consumer_thread = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global consumer_instance, consumer_thread
    
    logger.info("Service Started")
    
    # Start Kafka Consumer in a background thread
    consumer_instance = NotificationConsumer()
    consumer_thread = threading.Thread(target=consumer_instance.start, daemon=True)
    consumer_thread.start()
    
    yield
    
    # Graceful shutdown
    if consumer_instance:
        consumer_instance.stop()
    if consumer_thread:
        consumer_thread.join(timeout=5.0)
    logger.info("Service shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, tags=["Health"])
app.include_router(metrics_router, tags=["Metrics"])
app.include_router(history_router, tags=["History"])
