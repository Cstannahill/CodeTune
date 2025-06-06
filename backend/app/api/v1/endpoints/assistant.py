from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from openai import BadRequestError
from app.services.assistant_service import AssistantService
from app.core.logger import logger

router = APIRouter(prefix="/assistant", tags=["assistant"])


class ChatRequest(BaseModel):
    messages: list[dict]
    model: str | None = None


async def get_service():
    return AssistantService()


@router.post("/chat")
async def chat(req: ChatRequest, service: AssistantService = Depends(get_service)):
    model = req.model or "o4-mini"
    # Log request details
    logger.log(f"Assistant chat request: model={model}, messages={len(req.messages)}")
    try:
        result = await service.chat(req.messages, model=model)
        # Log response
        logger.log(f"Assistant chat response: {result}")
        return {"response": result}
    except BadRequestError as e:
        logger.log("OpenAI BadRequest error", exc_info=True)
        raise HTTPException(status_code=400, detail=e.args[0])
    except Exception:
        logger.log("Assistant endpoint error", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
