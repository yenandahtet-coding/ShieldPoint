from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config.logging_config import setup_logging
from app.api import health, metrics, transactions
from app.consumer import consumer_worker
import logging
from app.models.database import engine
from app.models import models

models.Base.metadata.create_all(bind=engine)

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(metrics.router)
app.include_router(transactions.router)
