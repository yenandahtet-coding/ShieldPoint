from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Nova Pay Notification Service"
    ENVIRONMENT: str = "development"
    KAFKA_BOOTSTRAP_SERVERS: str = "127.0.0.1:9092"
    CONSUMER_GROUP_ID: str = "notification-service-group"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
