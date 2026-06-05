# TradeAI AI Service — Engineering Guidelines

> This document is the single source of truth for architecture, coding standards, and tooling
> for the Python FastAPI AI microservice.
> Every engineer (and AI assistant) working on this service must follow it.
> Update it when conventions change — never let code drift silently from these rules.

---

## Table of Contents

1. [Project Stack](#1-project-stack)
2. [Folder Structure](#2-folder-structure)
3. [Naming Conventions](#3-naming-conventions)
4. [Endpoint Design](#4-endpoint-design)
5. [Python Style Rules](#5-python-style-rules)
6. [Claude API Rules](#6-claude-api-rules)
7. [Model Routing Strategy](#7-model-routing-strategy)
8. [Prompt Engineering Standards](#8-prompt-engineering-standards)
9. [Error Handling](#9-error-handling)
10. [Validation](#10-validation)
11. [Environment & Config](#11-environment--config)
12. [Testing](#12-testing)
13. [Security](#13-security)
14. [Portability Rules](#14-portability-rules)
15. [Available Scripts](#15-available-scripts)

---

## 1. Project Stack

| Layer | Choice | Notes |
|---|---|---|
| Language | Python 3.12+ | Type hints required everywhere |
| Framework | FastAPI | Async-native, Pydantic validation built-in |
| Claude SDK | `anthropic` (official) | Never call Claude API via raw HTTP |
| PDF extraction | `pdfplumber` | Better than PyPDF2 for messy invoices |
| Validation | Pydantic v2 | All inputs and outputs are Pydantic models |
| Server | Uvicorn | ASGI server |
| Testing | pytest + pytest-asyncio | Async test support |
| Linting | Ruff | Replaces flake8 + isort + black |
| Formatting | Ruff format | Black-compatible |
| Type checking | mypy (strict) | No untyped code |
| Dependency mgmt | pip + requirements.txt | Simple for prototype |

---

## 2. Folder Structure

```
services/ai/
├── app/
│   ├── main.py                 # FastAPI app, router registration, lifespan
│   ├── config.py               # Env vars — single source of truth
│   │
│   ├── routes/                 # Thin HTTP handlers — delegate to services
│   │   ├── extract.py          # POST /extract
│   │   ├── classify.py         # POST /classify
│   │   └── health.py           # GET /health
│   │
│   ├── services/               # Business logic — no FastAPI, no HTTP
│   │   ├── extractor.py        # PDF → structured line items
│   │   └── classifier.py       # Description → HS code
│   │
│   ├── prompts/                # Prompt templates — separate from code
│   │   ├── extract.py          # Extraction system + user prompt
│   │   └── classify.py         # Classification system + user prompt
│   │
│   ├── schemas/                # Pydantic models — inputs, outputs, internal
│   │   ├── extract.py
│   │   └── classify.py
│   │
│   └── infrastructure/         # External deps — Claude client, nothing else for now
│       └── claude.py           # Anthropic SDK wrapper
│
├── tests/
│   ├── test_extractor.py
│   ├── test_classifier.py
│   └── fixtures/               # Sample PDFs and expected outputs
│       ├── sample_invoice_en.pdf
│       └── sample_invoice_ar.pdf
│
├── requirements.txt
├── requirements-dev.txt
├── Dockerfile
├── .env.example
└── GUIDELINES.md
```

**Rules:**

- Never import FastAPI inside `services/` — services are pure Python.
- Never import `anthropic` directly in routes or services — only in `infrastructure/claude.py`.
- Never put prompt strings inline in service code — all prompts live in `prompts/`.
- No `__init__.py` barrel imports — import directly from the module file.

---

## 3. Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Files | `snake_case.py` | `extractor.py`, `classify.py` |
| Functions | `snake_case` | `extract_line_items`, `classify_description` |
| Classes | `PascalCase` | `LineItem`, `ClassifyResult` |
| Pydantic models | `PascalCase` | `ClassifyRequest`, `ClassifyResponse` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_FILE_SIZE_MB`, `SIMILARITY_THRESHOLD` |
| Async functions | prefix `a_` if both sync and async exist | `a_classify`, `classify` |

**Type hints on every function — no exceptions.**

```python
# ✅
async def classify_description(description: str, origin: str) -> ClassifyResult:
    ...

# ❌ — no return type, no arg types
async def classify_description(description, origin):
    ...
```

---

## 4. Endpoint Design

Routes are thin. They validate input (Pydantic does this automatically), call a service
function, return output. Nothing else.

```python
# routes/classify.py

from fastapi import APIRouter
from app.schemas.classify import ClassifyRequest, ClassifyResponse
from app.services.classifier import classify_description

router = APIRouter()

@router.post("/classify", response_model=ClassifyResponse)
async def classify(body: ClassifyRequest) -> ClassifyResponse:
    return await classify_description(
        description=body.description,
        origin=body.origin_country,
        mode=body.mode,
    )
```

**Rules:**

- Route functions do exactly three things: receive, delegate, return.
- All response shapes declared as Pydantic models on `response_model`.
- HTTP status codes: `200` success, `422` validation (FastAPI default), `500` unexpected.
- This service is **internal only** — called by `apps/api`, not directly by the frontend.
  No auth on endpoints (the API layer handles auth). Add network-level restriction in prod.

---

## 5. Python Style Rules

```python
# ✅ Type hints everywhere
def normalize_description(text: str) -> str:
    return text.lower().strip()

# ✅ Pydantic models for all data shapes — not dicts
class LineItem(BaseModel):
    line_number: int
    description: str
    quantity: str
    origin: str | None = None
    unit_value: float | None = None

# ❌ Returning raw dicts from services
def extract() -> dict:  # no — use a Pydantic model
    return {"description": "...", "qty": "..."}

# ✅ Early returns over nested conditionals
def pick_model(description: str) -> str:
    if is_sensitive_goods(description):
        return "claude-sonnet-4-6"
    return "claude-haiku-4-5-20251001"

# ✅ Explicit over implicit — no magic
# ❌ Don't use *args/**kwargs unless truly necessary

# ✅ f-strings for formatting, never % or .format()
message = f"Classified {item_count} items in {elapsed:.2f}s"
```

**Imports order** (Ruff enforces this):

```python
# 1. Standard library
import os
from typing import Literal

# 2. Third-party
import anthropic
from fastapi import APIRouter
from pydantic import BaseModel

# 3. Internal
from app.config import settings
from app.schemas.classify import ClassifyRequest
```

---

## 6. Claude API Rules

All Claude API calls go through `infrastructure/claude.py`. Never instantiate
`anthropic.Anthropic()` outside this file.

```python
# infrastructure/claude.py

import anthropic
from app.config import settings

_client: anthropic.AsyncAnthropic | None = None

def get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client

async def complete(
    system: str,
    user: str,
    model: str,
    max_tokens: int = 1024,
) -> str:
    client = get_client()
    message = await client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return message.content[0].text
```

**Rules:**

- Always use `AsyncAnthropic` — this is an async service, never block the event loop.
- Always set `max_tokens` explicitly — never rely on defaults.
- Always use structured output (ask Claude to return JSON, parse with Pydantic).
- Never log full prompt contents — they may contain sensitive invoice data.
- Handle `anthropic.APIError`, `anthropic.RateLimitError`, `anthropic.APITimeoutError`
  explicitly — do not let them bubble up as 500s without context.

---

## 7. Model Routing Strategy

Cost optimisation is built into the classifier. The model choice is made per request
based on the description content.

```python
# services/classifier.py

SENSITIVE_CHAPTERS = {
    "28", "29",  # chemicals
    "36",        # explosives / pyrotechnics
    "84", "85",  # machinery/electronics (potential dual-use)
    "87",        # vehicles (military potential)
    "88",        # aircraft
    "93",        # arms & ammunition
}

def _pick_model(description: str) -> str:
    description_lower = description.lower()
    sensitive_keywords = [
        "chemical", "explosive", "military", "weapon", "ammunition",
        "radioactive", "nuclear", "drone", "cipher", "encryption",
    ]
    if any(kw in description_lower for kw in sensitive_keywords):
        return "claude-sonnet-4-6"
    return "claude-haiku-4-5-20251001"
```

| Condition | Model | Reason |
|---|---|---|
| Standard goods (electronics, textiles, food) | `claude-haiku-4-5-20251001` | 6x cheaper, sufficient accuracy |
| Chemicals (Ch. 28-29) | `claude-sonnet-4-6` | Nuanced sub-classification required |
| Dual-use / DG keywords | `claude-sonnet-4-6` | Compliance risk too high for Haiku |
| Arabic input | `claude-haiku-4-5-20251001` | Both models handle Arabic well |

Always log which model was used — it appears in the `source_model` field of the response.

---

## 8. Prompt Engineering Standards

Prompts live in `prompts/` as Python modules — never inline in service code.
This makes them easy to version, test, and iterate without touching logic.

```python
# prompts/classify.py

SYSTEM_PROMPT = """
You are a GCC customs tariff specialist with deep expertise in the UAE Integrated
Customs Tariff (12-digit GCC format, effective January 2026).

Classification rules:
- Always return the full 12-digit GCC code (format: XXXX.XX.XX.XX)
- Use the January 2026 GCC tariff schedule — 13,400+ tariff lines
- The structure is: 6-digit WCO + 2-digit GCC regional + 4-digit UAE national
- When uncertain between two codes, state both as alternatives
- Flag any dual-use goods, controlled substances, or sanctions-sensitive items

Output format: Return valid JSON only. No explanation outside the JSON.
"""

def build_user_prompt(description: str, origin: str | None, quantity: str | None) -> str:
    parts = [f"Product description: {description}"]
    if origin:
        parts.append(f"Country of origin: {origin}")
    if quantity:
        parts.append(f"Quantity: {quantity}")
    parts.append("""
Return JSON with this exact shape:
{
  "hs_code": "8471.30.00.00",
  "title": "Portable ADP machines weighing not more than 10kg",
  "chapter": "Ch. 84 — Machinery & mechanical appliances",
  "confidence": 0.97,
  "reasoning": "...",
  "risk_level": "Clear",
  "flag_note": null,
  "alternatives": [
    { "code": "8471.41.00.00", "reason": "Rejected because..." }
  ]
}
""")
    return "\n".join(parts)
```

**Prompt rules:**

- System prompt is static — never build it dynamically.
- User prompt is built by a function — always typed, always testable.
- Always ask for JSON output explicitly — never free-form text from classification prompts.
- Always specify the exact JSON shape in the prompt — Claude follows schemas reliably.
- Test prompts with at least 10 real invoice descriptions before considering them stable.
- When iterating prompts, keep the old version commented until the new one is validated.

---

## 9. Error Handling

```python
# services/classifier.py

import anthropic
from app.schemas.classify import ClassifyResponse

class ClassificationError(Exception):
    def __init__(self, message: str, code: str, status_code: int = 500) -> None:
        super().__init__(message)
        self.code = code
        self.status_code = status_code

async def classify_description(description: str, origin: str) -> ClassifyResponse:
    try:
        raw = await claude_complete(...)
        return ClassifyResponse.model_validate_json(raw)
    except anthropic.RateLimitError:
        raise ClassificationError("Claude rate limit hit", "RATE_LIMIT", 429)
    except anthropic.APITimeoutError:
        raise ClassificationError("Claude timed out", "AI_TIMEOUT", 504)
    except anthropic.APIError as e:
        raise ClassificationError(f"Claude API error: {e.status_code}", "AI_ERROR", 502)
    except ValueError as e:
        # Claude returned malformed JSON
        raise ClassificationError("Malformed AI response", "PARSE_ERROR", 502)
```

```python
# main.py — global error handler

from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(ClassificationError)
async def classification_error_handler(
    request: Request,
    exc: ClassificationError,
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": {"code": exc.code, "message": str(exc)}},
    )
```

**Rules:**

- Always catch specific `anthropic.*` exceptions — never bare `except Exception`.
- Always handle JSON parse failures — Claude occasionally returns malformed output.
- Retry on `RateLimitError` with exponential backoff (max 3 attempts) before raising.
- Never expose raw exception messages to callers — wrap with context.

---

## 10. Validation

Pydantic v2 validates all inputs automatically when declared on route functions.

```python
# schemas/classify.py

from pydantic import BaseModel, Field, field_validator

class ClassifyRequest(BaseModel):
    description: str = Field(min_length=3, max_length=2000)
    origin_country: str | None = Field(default=None, max_length=100)
    quantity: str | None = Field(default=None, max_length=100)
    mode: Literal["import", "export"] = "import"

    @field_validator("description")
    @classmethod
    def strip_description(cls, v: str) -> str:
        return v.strip()

class ClassifyResponse(BaseModel):
    hs_code: str = Field(pattern=r"^\d{4}\.\d{2}\.\d{2}\.\d{2}$")
    title: str
    chapter: str
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str
    risk_level: Literal["Clear", "Review", "Flagged"]
    flag_note: str | None = None
    alternatives: list[AlternativeCode] = Field(default_factory=list)
    source_model: str
```

The `hs_code` regex `^\d{4}\.\d{2}\.\d{2}\.\d{2}$` enforces 12-digit GCC format on
every response. If Claude returns a malformed code, validation fails loudly.

---

## 11. Environment & Config

```python
# config.py

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    anthropic_api_key: str
    port: int = 8000
    log_level: str = "info"
    max_file_size_mb: int = 10
    request_timeout_seconds: int = 30

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

settings = Settings()  # fails at import if required vars are missing
```

`pydantic-settings` reads from environment variables and `.env` file automatically.
If `ANTHROPIC_API_KEY` is missing, the service refuses to start with a clear error.

---

## 12. Testing

### What to test

| Layer | Test type | Focus |
|---|---|---|
| `services/` | Unit | Business logic with mocked Claude client |
| `prompts/` | Unit | Prompt builder output for known inputs |
| `routes/` | Integration | Full request/response via `TestClient` |
| Claude output parsing | Unit | Pydantic validation of real Claude outputs |

### Test structure

```python
# tests/test_classifier.py

import pytest
from unittest.mock import AsyncMock, patch
from app.services.classifier import classify_description
from app.schemas.classify import ClassifyResponse

@pytest.mark.asyncio
async def test_classifies_laptop_correctly():
    mock_response = '''{
        "hs_code": "8471.30.00.00",
        "title": "Portable ADP machines",
        "chapter": "Ch. 84",
        "confidence": 0.97,
        "reasoning": "Portable laptop...",
        "risk_level": "Clear",
        "flag_note": null,
        "alternatives": [],
        "source_model": "claude-haiku-4-5-20251001"
    }'''

    with patch("app.infrastructure.claude.complete", AsyncMock(return_value=mock_response)):
        result = await classify_description("Dell Latitude 5440 laptop", origin="China")

    assert result.hs_code == "8471.30.00.00"
    assert result.confidence == 0.97
    assert result.risk_level == "Clear"

@pytest.mark.asyncio
async def test_routes_chemicals_to_sonnet():
    with patch("app.services.classifier._pick_model") as mock_pick:
        await classify_description("Sodium hydroxide 99% purity", origin="Germany")
        mock_pick.assert_called_once()
        assert "sonnet" in mock_pick.return_value
```

### Fixtures

Keep real sample PDF invoices in `tests/fixtures/`:
- `sample_invoice_en.pdf` — English, 10+ line items, mix of risk levels
- `sample_invoice_ar.pdf` — Arabic, simulates a UAE supplier invoice

These are used in integration tests to validate the full extract → classify pipeline.

---

## 13. Security

- **`ANTHROPIC_API_KEY` never in source code** — env var only, gitignored.
- **File upload validation**: check MIME type (`application/pdf`) and size before
  passing to pdfplumber. Reject anything that isn't a valid PDF.
- **No user-supplied data in system prompts** — only in user prompts, properly isolated.
- **Prompt injection awareness**: invoice descriptions are user-supplied text. They go
  into the user message only — never concatenated into the system prompt.
- **Internal service only**: this service should not be reachable from the public internet.
  In production, restrict access to the API service's IP/VPC only.
- **Never log invoice contents** — they may contain commercially sensitive trade data.

---

## 14. Portability Rules

This service is stateless by design. It can move from Railway to AWS ECS, GCP Cloud Run,
or an on-premise server without any code changes.

1. **Stateless** — no in-memory state between requests. No file system writes in the app
   (temp files for PDF processing are cleaned up in a `finally` block).

2. **All config from environment variables** — no hardcoded regions, bucket names, or URLs.

3. **Dockerfile at the root of this package** — the container is the deployment unit.

4. **Health endpoint always at `GET /health`**:
   ```python
   @router.get("/health")
   async def health() -> dict[str, str]:
       return {"status": "ok", "model": "claude-haiku-4-5-20251001"}
   ```

5. **Graceful shutdown** — Uvicorn handles `SIGTERM` by default. Ensure no request
   processing hangs past the `request_timeout_seconds` limit.

6. **No filesystem dependencies** — PDFs are processed in memory, not written to disk.
   If file storage is needed later, it goes through the API layer via R2/S3.

---

## 15. Available Scripts

| Command | What it does |
|---|---|
| `uvicorn app.main:app --reload` | Start dev server with hot reload |
| `uvicorn app.main:app` | Start production server |
| `pytest` | Run all tests |
| `pytest -v tests/test_classifier.py` | Run specific test file |
| `ruff check .` | Lint — zero warnings in CI |
| `ruff format .` | Format all files |
| `mypy app/` | Type check |
| `pip install -r requirements.txt` | Install production deps |
| `pip install -r requirements-dev.txt` | Install dev deps |

---

> Last updated: 2026-06-04
> Maintained by: Nexavine Tech
