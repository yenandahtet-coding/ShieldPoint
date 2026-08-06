import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Nova Pay API Service"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql://user:password@localhost/dbname"
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
