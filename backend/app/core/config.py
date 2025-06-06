from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "CodeTune Backend"
    mongodb_uri: str = Field(..., description="MongoDB URI")
    mongodb_db: str = Field(default="codetune", description="MongoDB database name")
    openai_api_key: str = Field(..., description="OpenAI API key")
    huggingface_token: str | None = Field(default=None, description="HuggingFace token")

    model_config = {"env_file": ".env", "case_sensitive": False, "extra": "ignore"}


settings = Settings()  # type: ignore
