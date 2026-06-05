from __future__ import annotations

import base64
import io
import json
from app.infrastructure.claude import complete, complete_vision, resolve_model
from app.prompts.extract import SYSTEM_PROMPT, build_user_prompt, VISION_USER_PROMPT
from app.schemas.extract import ExtractResponse, LineItem

try:
    import pdfplumber
    _PDF_AVAILABLE = True
except ImportError:
    _PDF_AVAILABLE = False

MAX_CHARS = 12_000

SUPPORTED_IMAGE_TYPES = {
    "image/jpeg": "image/jpeg",
    "image/jpg": "image/jpeg",
    "image/png": "image/png",
    "image/webp": "image/webp",
}


class ExtractionError(Exception):
    def __init__(self, message: str, code: str, status_code: int = 500) -> None:
        super().__init__(message)
        self.code = code
        self.status_code = status_code


def _pdf_to_text(file_bytes: bytes) -> str:
    if not _PDF_AVAILABLE:
        raise ExtractionError("pdfplumber not installed", "PDF_ERROR", 500)
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        pages = [page.extract_text() or "" for page in pdf.pages]
    return "\n".join(pages).strip()


def _to_b64(file_bytes: bytes) -> str:
    return base64.standard_b64encode(file_bytes).decode("utf-8")


async def _extract_via_vision(file_bytes: bytes, media_type: str, language: str) -> ExtractResponse:
    model = resolve_model("smart")
    image_b64 = _to_b64(file_bytes)
    raw = await complete_vision(
        system=SYSTEM_PROMPT,
        user=VISION_USER_PROMPT if language == "en" else VISION_USER_PROMPT + " The document may contain Arabic text — extract Arabic as-is and add [EN: translation] inline.",
        model=model,
        image_b64=image_b64,
        media_type=media_type,
        max_tokens=16_384,
    )
    return _parse_response(raw, preview="[vision extraction]")


async def _extract_via_text(text: str, language: str) -> ExtractResponse:
    model = resolve_model("fast")
    truncated = text[:MAX_CHARS]
    raw = await complete(
        system=SYSTEM_PROMPT,
        user=build_user_prompt(truncated, language),
        model=model,
        max_tokens=16_384,
    )
    return _parse_response(raw, preview=text[:200])


def _parse_response(raw: str, preview: str) -> ExtractResponse:
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    try:
        data = json.loads(text)
        items = [LineItem(**item) for item in data.get("items", [])]
        return ExtractResponse(items=items, raw_text_preview=preview)
    except (KeyError, ValueError, json.JSONDecodeError) as e:
        raise ExtractionError(f"Malformed AI response: {e}", "PARSE_ERROR", 502)


async def extract_line_items(
    file_bytes: bytes,
    media_type: str,
    language: str = "en",
) -> ExtractResponse:
    try:
        # Image — go straight to vision
        if media_type in SUPPORTED_IMAGE_TYPES:
            return await _extract_via_vision(file_bytes, SUPPORTED_IMAGE_TYPES[media_type], language)

        # PDF — try text extraction first (fast + cheap)
        # Fall back to vision if the PDF is scanned / image-based
        if media_type == "application/pdf":
            try:
                text = _pdf_to_text(file_bytes)
            except ExtractionError:
                raise
            except Exception as e:
                raise ExtractionError(f"PDF read failed: {e}", "PDF_ERROR", 422)

            if text.strip():
                return await _extract_via_text(text, language)

            # Empty text = scanned PDF — treat as image via vision
            return await _extract_via_vision(file_bytes, "application/pdf", language)

        raise ExtractionError(
            f"Unsupported file type: {media_type}",
            "INVALID_FILE_TYPE",
            422,
        )

    except ExtractionError:
        raise
    except Exception as e:
        msg = str(e).lower()
        if "rate limit" in msg:
            raise ExtractionError("LLM rate limit hit", "RATE_LIMIT", 429)
        if "timeout" in msg or "timed out" in msg:
            raise ExtractionError("LLM timed out", "AI_TIMEOUT", 504)
        raise ExtractionError(f"LLM error: {e}", "AI_ERROR", 502)
