import logging
from app.config.settings import settings

def setup_logging():
    logging.basicConfig(
        level=logging.INFO if settings.ENVIRONMENT == "development" else logging.WARNING,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    # Suppress verbose kafka logs unless debugging
    logging.getLogger("confluent_kafka").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)
