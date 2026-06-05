from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field


class ExtractRequest(BaseModel):
    language: Literal["en", "ar"] = "en"


class LineItem(BaseModel):
    line_number: int
    description: str
    quantity: str | None = None
    origin_country: str | None = None
    unit_value: float | None = None


class ExtractResponse(BaseModel):
    items: list[LineItem] = Field(default_factory=list)
    raw_text_preview: str = Field(default="", description="First 200 chars of extracted text for debugging")
