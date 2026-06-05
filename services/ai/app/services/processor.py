from __future__ import annotations

import json
import unicodedata
import hashlib

from app.infrastructure.db import (
    job_set_processing,
    job_increment_completed,
    job_finalize,
    result_insert,
)
from app.services.extractor import extract_line_items
from app.services.classifier import classify_description


def _normalize(text: str) -> str:
    return unicodedata.normalize("NFKC", text).lower().strip()


async def process_document_job(
    job_id: str,
    file_bytes: bytes,
    media_type: str,
    language: str = "en",
) -> None:
    try:
        # Step 1 — Extract
        extraction = await extract_line_items(file_bytes, media_type, language)
        items = extraction.items

        await job_set_processing(job_id, len(items))

        # Step 2 — Classify each item and write results
        for item in items:
            try:
                result = await classify_description(
                    description=item.description,
                    origin_country=item.origin_country,
                    quantity=item.quantity,
                    unit_value=item.unit_value,
                    language=language,
                )
                await result_insert(
                    job_id=job_id,
                    line_number=item.line_number,
                    raw_description=item.description,
                    normalized_description=_normalize(item.description),
                    hs_code=result.hs_code.replace(".", "")[:12].ljust(12, "0"),
                    hs_title=result.title,
                    hs_chapter=result.chapter,
                    confidence=result.confidence,
                    risk_level=result.risk_level,
                    source="ai",
                    ai_reasoning=result.reasoning,
                    alternatives=json.dumps([{"code": a.code, "reason": a.reason} for a in result.alternatives]),
                    sanctions_ofac=result.sanctions_ofac,
                    sanctions_un=result.sanctions_un,
                    sanctions_eu=result.sanctions_eu,
                    flag_note=result.flag_note,
                )
            except Exception:
                # Store failed placeholder so job can still complete with partial data
                await result_insert(
                    job_id=job_id,
                    line_number=item.line_number,
                    raw_description=item.description,
                    normalized_description=_normalize(item.description),
                    hs_code="".ljust(12, "0"),
                    hs_title="",
                    hs_chapter="",
                    confidence=0.0,
                    risk_level="Review",
                    source="ai",
                    ai_reasoning="Classification failed",
                    alternatives="[]",
                    sanctions_ofac="Clear",
                    sanctions_un="Clear",
                    sanctions_eu="Clear",
                    flag_note=None,
                )

            await job_increment_completed(job_id)

        await job_finalize(job_id, "completed")

    except Exception as e:
        await job_finalize(job_id, "failed", str(e))
