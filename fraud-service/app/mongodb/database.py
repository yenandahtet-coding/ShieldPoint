import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
import certifi

class MongoDBClient:
    def __init__(self):
        self._clients = {}

    @property
    def client(self):
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None
            
        if loop not in self._clients:
            self._clients[loop] = AsyncIOMotorClient(settings.MONGODB_URL, tlsCAFile=certifi.where())
        return self._clients[loop]

    @property
    def db(self):
        return self.client[settings.MONGODB_DB_NAME]

    def connect(self):
        # Trigger lazy init for the main loop
        _ = self.client

    def close(self):
        for client in self._clients.values():
            client.close()
        self._clients.clear()

db_client = MongoDBClient()
