from typing import List, Dict
import ollama
import logging

logger = logging.getLogger(__name__)


class OllamaService:
    def __init__(self):
        self.client = ollama.AsyncClient()

    async def list_models(self) -> List[str]:
        res = await self.client.list()
        # Filter out any None entries
        return [m.model for m in res.models if m.model]

    async def pull_model(self, model: str) -> None:
        await self.client.pull(model)

    async def chat(self, messages: List[Dict], model: str) -> str:
        logger.debug(
            "Starting Ollama chat",
            extra={"model": model, "message_count": len(messages)},
        )
        try:
            res = await self.client.chat(model=model, messages=messages)
            content = res.message.content or ""
            logger.debug(
                "Received Ollama chat response",
                extra={"model": model, "content": content},
            )
            return content
        except Exception as e:
            logger.error("Ollama chat error", exc_info=True, extra={"model": model})
            raise
