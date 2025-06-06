from sqlalchemy import Column, String, JSON
from app.core.database import Database


class User(Database):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    ollama_models = Column(JSON, nullable=True)
