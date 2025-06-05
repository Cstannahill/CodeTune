from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ...core.config import settings
from ....services.assistant_service import AssistantService

router = APIRouter(prefix="/assistant", tags=["assistant"])

class ChatRequest(BaseModel):
    messages: list[dict]
    model: str | None = None

async def get_service():
    return AssistantService()

@router.post("/chat")
async def chat(req: ChatRequest, service: AssistantService = Depends(get_service)):
    model = req.model or "gpt-3.5-turbo"
    response = await service.chat(req.messages, model=model)
    return {"response": response}
