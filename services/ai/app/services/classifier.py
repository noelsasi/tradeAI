from __future__ import annotations

import json
from app.infrastructure.claude import complete, resolve_model
from app.prompts.classify import SYSTEM_PROMPT, build_user_prompt
from app.schemas.classify import AlternativeCode, ClassifyResponse

SENSITIVE_KEYWORDS = (
    "chemical", "explosive", "military", "weapon", "ammunition",
    "radioactive", "nuclear", "drone", "cipher", "encryption",
    "poison", "toxic", "narcotic", "firearm", "pistol", "rifle",
)


def _pick_model(description: str) -> str:
    lower = description.lower()
    if any(kw in lower for kw in SENSITIVE_KEYWORDS):
        return resolve_model("smart")
    return resolve_model("fast")


class ClassificationError(Exception):
    def __init__(self, message: str, code: str, status_code: int = 500) -> None:
        super().__init__(message)
        self.code = code
        self.status_code = status_code


async def classify_description(
    description: str,
    origin_country: str | None = None,
    quantity: str | None = None,
    unit_value: float | None = None,
    language: str = "en",
) -> ClassifyResponse:
    model = _pick_model(description)
    user_prompt = build_user_prompt(description, origin_country, quantity, unit_value, language)

    try:
        raw = await complete(
            system=SYSTEM_PROMPT,
            user=user_prompt,
            model=model,
            max_tokens=8192,
        )
    except Exception as e:
        msg = str(e)
        if "rate limit" in msg.lower():
            raise ClassificationError("LLM rate limit hit", "RATE_LIMIT", 429)
        if "timeout" in msg.lower() or "timed out" in msg.lower():
            raise ClassificationError("LLM timed out", "AI_TIMEOUT", 504)
        raise ClassificationError(f"LLM error: {msg}", "AI_ERROR", 502)

    # Strip markdown code fences if the model wraps its JSON
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    try:
        data = json.loads(text)
        alternatives = [
            AlternativeCode(code=alt.get("code", ""), reason=alt.get("reason", ""))
            for alt in data.get("alternatives", [])
        ]
        return ClassifyResponse(
            hs_code=data["hs_code"],
            title=data["title"],
            chapter=data["chapter"],
            confidence=float(data["confidence"]),
            reasoning=data["reasoning"],
            risk_level=data["risk_level"],
            flag_note=data.get("flag_note"),
            alternatives=alternatives,
            source_model=model,
        )
    except (KeyError, ValueError, json.JSONDecodeError) as e:
        raise ClassificationError(f"Malformed AI response: {e}", "PARSE_ERROR", 502)
