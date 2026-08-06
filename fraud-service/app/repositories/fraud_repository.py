import logging
from app.mongodb.database import db_client
from typing import Dict, Any

logger = logging.getLogger(__name__)

class FraudRepository:
    def __init__(self):
        self.collection_name = "fraud_reports"

    async def save_fraud_report(self, document: Dict[str, Any]) -> str:
        """
        Saves a suspicious transaction report to MongoDB.
        Returns the inserted ID string.
        """
        try:
            collection = db_client.db[self.collection_name]
            result = await collection.insert_one(document)
            logger.info(f"Fraud report saved to MongoDB with ID: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error saving fraud report to MongoDB: {e}")
            raise
