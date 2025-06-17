from pydantic import BaseModel

class DatasetInfo(BaseModel):
    name: str
    path: str
    size: int
