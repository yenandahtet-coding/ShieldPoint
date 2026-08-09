from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
import certifi

class MongoDBClient:
    def __init__(self):
        self.client = None
        self.db = None

    def connect(self):
        mongo_url = settings.MONGODB_URL.strip(" \r\n\"'")
        self.client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
        self.db = self.client[settings.MONGODB_DB_NAME]

    def close(self):
        if self.client:
            self.client.close()

db_client = MongoDBClient()
