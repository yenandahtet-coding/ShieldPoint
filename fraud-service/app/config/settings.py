from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Fraud-Detection"
    ENVIRONMENT: str = "development"
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    CONSUMER_GROUP_ID: str = "fraud-service-group"
    MONGODB_URL: str = "mongodb+srv://kohtetttan112_db_user:gj7TAHUUA65fZro2"
    MONGODB_DB_NAME: str = "fraud"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
