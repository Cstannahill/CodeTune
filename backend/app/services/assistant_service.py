from typing import List, Dict
import openai
from ..core.config import settings

class AssistantService:
    def __init__(self):
        self.client = openai.AsyncOpenAI(api_key=settings.openai_api_key)

    async def chat(self, messages: List[Dict], model: str = "gpt-3.5-turbo") -> str:
        response = await self.client.chat.completions.create(
            model=model,
            messages=messages,
        )
        return response.choices[0].message.content
