from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # FastAPI
    APP_NAME: str = "Jules API"
    DEBUG: bool = False

    # Server
    API_PREFIX: str = "/api"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:4700"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
