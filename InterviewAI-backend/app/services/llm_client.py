# app/services/llm_client.py
import os
from typing import Optional


def get_llm(provider: str = "openai", api_key: Optional[str] = None, model: Optional[str] = None):
    """
    Factory that returns a simple LLM client object with a consistent .invoke() interface.
    Supports multiple providers. Imports are lazy to avoid hard dependencies.
    """
    provider = (provider or "openai").lower()

    if provider == "openai":
        try:
            # Preferred: modern langchain-openai Chat wrapper
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                api_key=api_key or os.getenv("OPENAI_API_KEY"),
                model=model or "gpt-4o-mini",
                temperature=0.3,
            )
        except Exception:
            # Fallback: legacy community OpenAI wrapper
            try:
                from langchain_community.chat_models import ChatOpenAI as CommunityChatOpenAI
                return CommunityChatOpenAI(
                    openai_api_key=api_key or os.getenv("OPENAI_API_KEY"),
                    model=model or "gpt-4o-mini",
                    temperature=0.3,
                )
            except Exception as e:
                raise RuntimeError(
                    "OpenAI wrapper not installed. Install `langchain-openai` or `langchain-community`."
                ) from e

    if provider in ("gemini", "google"):
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                api_key=api_key or os.getenv("GEMINI_API_KEY"),
                model=model or "gemini-1.5-mini",
                temperature=0.3,
            )
        except Exception as e:
            raise RuntimeError(
                "Gemini/Google wrapper not installed. Install `langchain-google-genai`."
            ) from e

    if provider == "anthropic":
        try:
            from langchain_anthropic import ChatAnthropic
            return ChatAnthropic(
                api_key=api_key or os.getenv("ANTHROPIC_API_KEY"),
                model=model or "claude-2",
                temperature=0.3,
            )
        except Exception as e:
            raise RuntimeError("Anthropic wrapper not installed.") from e

    raise ValueError(f"Unsupported provider {provider}")
