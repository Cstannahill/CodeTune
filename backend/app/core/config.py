from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    app_name: str = "CodeTune Backend"
    mongodb_uri: str = Field(..., env="MONGODB_URI")
    mongodb_db: str = Field(default="codetune", env="MONGODB_DB")
    class Config:
        case_sensitive = True

settings = Settings()
