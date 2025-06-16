from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ....services import OllamaService

router = APIRouter(prefix="/ollama", tags=["ollama"])


def get_service():
    return OllamaService()


@router.get("/models")
async def list_models(service: OllamaService = Depends(get_service)):
    return await service.list_models()


class ChatRequest(BaseModel):
    messages: list[dict]
    model: str


@router.post("/chat")
async def chat(req: ChatRequest, service: OllamaService = Depends(get_service)):
    response = await service.chat(req.messages, req.model)
    return {"response": response}


class PullRequest(BaseModel):
    model: str


@router.post("/pull")
async def pull(req: PullRequest, service: OllamaService = Depends(get_service)):
    await service.pull_model(req.model)
    return {"status": "ok"}


class CreateRequest(BaseModel):
    name: str
    modelfile: str
    gguf_path: str | None = None


@router.post("/create")
async def create(req: CreateRequest, service: OllamaService = Depends(get_service)):
    await service.create_model(req.name, req.modelfile, req.gguf_path)
    return {"status": "ok"}
