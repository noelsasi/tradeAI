from typing import Literal
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── LLM Provider ──────────────────────────────────────────────────────────
    llm_provider: Literal["anthropic", "openai", "azure_openai"] = "openai"

    # Anthropic
    anthropic_api_key: str = ""

    # OpenAI
    openai_api_key: str = ""

    # Azure OpenAI (used when llm_provider = "azure_openai")
    azure_openai_api_key: str = ""
    azure_openai_endpoint: str = ""          # e.g. https://<resource>.openai.azure.com
    azure_openai_api_version: str = "2024-02-01"
    azure_openai_fast_deployment: str = ""   # deployment name for fast model
    azure_openai_smart_deployment: str = ""  # deployment name for smart model

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str = ""

    # ── Service ───────────────────────────────────────────────────────────────
    port: int = 8000
    log_level: str = "info"
    max_file_size_mb: int = 10
    request_timeout_seconds: int = 30

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
