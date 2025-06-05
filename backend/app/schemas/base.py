from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

class DBModelMixin(BaseModel):
    id: PyObjectId | None = Field(alias="_id", default=None)
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        json_encoders = {ObjectId: str}
        allow_population_by_field_name = True
