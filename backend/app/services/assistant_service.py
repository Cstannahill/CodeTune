import logging
from openai import OpenAI
from typing import List, Dict, Any
from app.core.config import settings


logger = logging.getLogger(__name__)


class AssistantService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)

    async def chat(
        self,
        messages: List[Dict[str, Any]],
        model: str = "o4-mini",
        source: str = "assistant",
    ) -> str:
        """
        Chat with OpenAI using the Chat Completions API.

        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            model: OpenAI model to use for completion
            source: 'assistant' or 'model-tester' for logging

        Returns:
            String response from the assistant
        """
        logger.debug(
            "Starting chat",
            extra={"model": model, "message_count": len(messages), "source": source},
        )
        try:
            # Use default temperature for this model (only default supported)
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,  # type: ignore
                max_completion_tokens=1000,
            )

            content = response.choices[0].message.content
            logger.debug(
                "Received chat response",
                extra={"model": model, "content": content, "source": source},
            )
            return content or "No response generated"

        except Exception as e:
            logger.error(
                "OpenAI chat error",
                exc_info=True,
                extra={"model": model, "source": source},
            )
            raise

    async def create_completion(
        self,
        prompt: str,
        model: str = "o4-mini",
        source: str = "assistant",
    ) -> str:
        """
        Create a simple completion from a prompt.

        Args:
            prompt: The input prompt string
            model: OpenAI model to use
            source: 'assistant' or 'model-tester' for logging

        Returns:
            String response from the model
        """
        logger.debug(
            "Starting completion",
            extra={"model": model, "prompt": prompt, "source": source},
        )
        try:
            # Use default settings; temperature overridden only when supported
            response = self.client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],  # type: ignore
                max_completion_tokens=1000,
            )

            content = response.choices[0].message.content
            logger.debug(
                "Received completion response",
                extra={"model": model, "content": content, "source": source},
            )
            return content or "No response generated"

        except Exception as e:
            logger.error(
                "OpenAI completion error",
                exc_info=True,
                extra={"model": model, "source": source},
            )
            raise
