from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Nova Pay Logger Service"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "postgresql://nova_user:nova_password@localhost:5432/nova_logger"
    KAFKA_BOOTSTRAP_SERVERS: str = "127.0.0.1:9092"
    CONSUMER_GROUP_ID: str = "logger-service-group"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
