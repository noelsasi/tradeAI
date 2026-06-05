from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field


class AlternativeCode(BaseModel):
    code: str = Field(pattern=r"^\d{12}$")
    reason: str


class ClassifyRequest(BaseModel):
    description: str = Field(min_length=3, max_length=2000)
    origin_country: str | None = Field(default=None, max_length=100)
    quantity: str | None = Field(default=None, max_length=100)
    unit_value: float | None = None
    language: Literal["en", "ar"] = "en"

    @classmethod
    def __get_validators__(cls):  # type: ignore[override]
        yield cls.strip_fields

    def model_post_init(self, __context: object) -> None:
        self.description = self.description.strip()


class ClassifyResponse(BaseModel):
    hs_code: str = Field(pattern=r"^\d{12}$")
    title: str
    chapter: str
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str
    risk_level: Literal["Clear", "Review", "Flagged"]
    flag_note: str | None = None
    alternatives: list[AlternativeCode] = Field(default_factory=list)
    source_model: str
    sanctions_ofac: Literal["Clear", "Review", "Flagged"] = "Clear"
    sanctions_un: Literal["Clear", "Review", "Flagged"] = "Clear"
    sanctions_eu: Literal["Clear", "Review", "Flagged"] = "Clear"
