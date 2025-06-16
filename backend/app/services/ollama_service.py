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

    async def create_model(self, name: str, modelfile: str, gguf_path: str | None = None) -> None:
        """Create a local Ollama model from a Modelfile or GGUF checkpoint.

        If ``gguf_path`` is provided a minimal Modelfile will be written that
        references the GGUF file. Otherwise ``modelfile`` must point to an
        existing Modelfile on disk.
        """
        file_path = modelfile
        if gguf_path:
            file_path = modelfile
            template = (
                f"FROM {gguf_path}\n" +
                "TEMPLATE \"""{{ if .System }}\n{{ .System }}\n{{ end }}\n{{ .Prompt }}\""""
            )
            with open(file_path, "w") as f:
                f.write(template)
        await self.client.create(model=name, from_=file_path)

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
