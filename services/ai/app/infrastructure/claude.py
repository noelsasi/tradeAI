"""
LLM provider abstraction.

Set LLM_PROVIDER in .env to switch between providers:
  - openai        → OpenAI API (default)
  - anthropic     → Anthropic Claude API
  - azure_openai  → Azure OpenAI (requires AZURE_OPENAI_* vars)

All callers use complete(system, user, model, max_tokens).
Model names are logical aliases resolved per-provider in _resolve_model().
"""
from __future__ import annotations

import asyncio
from typing import Literal

from app.config import settings

# ── Logical model aliases ─────────────────────────────────────────────────────
# Callers pass "fast" or "smart"; each provider maps to its own model.

_MODEL_MAP: dict[str, dict[str, str]] = {
    "openai": {
        "fast": "gpt-5-mini",
        "smart": "gpt-5",
    },
    "anthropic": {
        "fast": "claude-haiku-4-5-20251001",
        "smart": "claude-sonnet-4-6",
    },
    "azure_openai": {
        "fast": settings.azure_openai_fast_deployment or "gpt-4o-mini",
        "smart": settings.azure_openai_smart_deployment or "gpt-4o",
    },
}


def resolve_model(alias: Literal["fast", "smart"]) -> str:
    """Return the provider-specific model name for a logical alias."""
    return _MODEL_MAP[settings.llm_provider][alias]


# ── Provider implementations ──────────────────────────────────────────────────

async def _complete_openai(system: str, user: str, model: str, max_tokens: int) -> str:
    import openai
    client = openai.AsyncOpenAI(api_key=settings.openai_api_key, timeout=120.0)
    response = await client.chat.completions.create(
        model=model,
        max_completion_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return response.choices[0].message.content or ""


async def _complete_openai_vision(
    system: str, user: str, model: str, max_tokens: int,
    image_b64: str, media_type: str,
) -> str:
    import openai
    client = openai.AsyncOpenAI(api_key=settings.openai_api_key, timeout=120.0)
    response = await client.chat.completions.create(
        model=model,
        max_completion_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": [
                {"type": "text", "text": user},
                {"type": "image_url", "image_url": {"url": f"data:{media_type};base64,{image_b64}"}},
            ]},
        ],
    )
    return response.choices[0].message.content or ""


async def _complete_azure(system: str, user: str, model: str, max_tokens: int) -> str:
    import openai
    client = openai.AsyncAzureOpenAI(
        api_key=settings.azure_openai_api_key,
        azure_endpoint=settings.azure_openai_endpoint,
        api_version=settings.azure_openai_api_version,
    )
    response = await client.chat.completions.create(
        model=model,
        max_completion_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return response.choices[0].message.content or ""


async def _complete_azure_vision(
    system: str, user: str, model: str, max_tokens: int,
    image_b64: str, media_type: str,
) -> str:
    import openai
    client = openai.AsyncAzureOpenAI(
        api_key=settings.azure_openai_api_key,
        azure_endpoint=settings.azure_openai_endpoint,
        api_version=settings.azure_openai_api_version,
    )
    response = await client.chat.completions.create(
        model=model,
        max_completion_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": [
                {"type": "text", "text": user},
                {"type": "image_url", "image_url": {"url": f"data:{media_type};base64,{image_b64}"}},
            ]},
        ],
    )
    return response.choices[0].message.content or ""


async def _complete_anthropic(system: str, user: str, model: str, max_tokens: int) -> str:
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    message = await client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return message.content[0].text  # type: ignore[union-attr]


async def _complete_anthropic_vision(
    system: str, user: str, model: str, max_tokens: int,
    image_b64: str, media_type: str,
) -> str:
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    message = await client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": [
            {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": image_b64}},
            {"type": "text", "text": user},
        ]}],
    )
    return message.content[0].text  # type: ignore[union-attr]


# ── Public interface ──────────────────────────────────────────────────────────

async def complete(
    system: str,
    user: str,
    model: str,
    max_tokens: int = 1024,
    retries: int = 3,
) -> str:
    """Text-only completion with retry + exponential backoff on rate limits."""
    provider = settings.llm_provider
    delay = 1.0
    last_error: Exception | None = None

    for attempt in range(retries):
        try:
            if provider == "openai":
                return await _complete_openai(system, user, model, max_tokens)
            elif provider == "azure_openai":
                return await _complete_azure(system, user, model, max_tokens)
            elif provider == "anthropic":
                return await _complete_anthropic(system, user, model, max_tokens)
            else:
                raise ValueError(f"Unknown LLM_PROVIDER: {provider}")

        except Exception as e:
            if _is_rate_limit(e) and attempt < retries - 1:
                last_error = e
                await asyncio.sleep(delay)
                delay *= 2
                continue
            raise

    raise last_error  # type: ignore[misc]


async def complete_vision(
    system: str,
    user: str,
    model: str,
    image_b64: str,
    media_type: str,
    max_tokens: int = 4096,
    retries: int = 3,
) -> str:
    """Vision completion — passes an image alongside the text prompt."""
    provider = settings.llm_provider
    delay = 1.0
    last_error: Exception | None = None

    for attempt in range(retries):
        try:
            if provider == "openai":
                return await _complete_openai_vision(system, user, model, max_tokens, image_b64, media_type)
            elif provider == "azure_openai":
                return await _complete_azure_vision(system, user, model, max_tokens, image_b64, media_type)
            elif provider == "anthropic":
                return await _complete_anthropic_vision(system, user, model, max_tokens, image_b64, media_type)
            else:
                raise ValueError(f"Unknown LLM_PROVIDER: {provider}")

        except Exception as e:
            if _is_rate_limit(e) and attempt < retries - 1:
                last_error = e
                await asyncio.sleep(delay)
                delay *= 2
                continue
            raise

    raise last_error  # type: ignore[misc]


def _is_rate_limit(e: Exception) -> bool:
    cls = type(e).__name__
    return cls in ("RateLimitError",) or "rate limit" in str(e).lower()
