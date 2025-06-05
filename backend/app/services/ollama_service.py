from typing import List, Dict
import ollama

class OllamaService:
    def __init__(self):
        self.client = ollama.AsyncClient()

    async def list_models(self) -> List[str]:
        res = await self.client.list()
        return [m.model for m in res.models]

    async def pull_model(self, model: str) -> None:
        await self.client.pull(model)

    async def chat(self, messages: List[Dict], model: str) -> str:
        res = await self.client.chat(model=model, messages=messages)
        return res.message.content
