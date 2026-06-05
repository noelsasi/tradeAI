from __future__ import annotations

import asyncpg
from app.config import settings

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        if not settings.database_url:
            raise RuntimeError("DATABASE_URL not set")
        _pool = await asyncpg.create_pool(settings.database_url, min_size=1, max_size=5)
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


# ── Job helpers ───────────────────────────────────────────────────────────────

async def job_set_processing(job_id: str, total_items: int) -> None:
    pool = await get_pool()
    await pool.execute(
        """
        UPDATE classification_jobs
        SET status = 'processing', total_items = $2, updated_at = NOW()
        WHERE id = $1
        """,
        job_id,
        total_items,
    )


async def job_increment_completed(job_id: str) -> None:
    pool = await get_pool()
    await pool.execute(
        "UPDATE classification_jobs SET completed_items = completed_items + 1, updated_at = NOW() WHERE id = $1",
        job_id,
    )


async def job_finalize(job_id: str, status: str, error: str | None = None) -> None:
    pool = await get_pool()
    await pool.execute(
        "UPDATE classification_jobs SET status = $2, error = $3, updated_at = NOW() WHERE id = $1",
        job_id,
        status,
        error,
    )


# ── Result helpers ────────────────────────────────────────────────────────────

async def result_insert(
    job_id: str,
    line_number: int,
    raw_description: str,
    normalized_description: str,
    hs_code: str,
    hs_title: str,
    hs_chapter: str,
    confidence: float,
    risk_level: str,
    source: str,
    ai_reasoning: str | None,
    alternatives: str,  # JSON string
    sanctions_ofac: str,
    sanctions_un: str,
    sanctions_eu: str,
    flag_note: str | None,
) -> None:
    pool = await get_pool()
    await pool.execute(
        """
        INSERT INTO classification_results (
            job_id, line_number, raw_description, normalized_description,
            hs_code, hs_title, hs_chapter, confidence,
            risk_level, source, ai_reasoning, alternatives,
            sanctions_ofac, sanctions_un, sanctions_eu, flag_note
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15,$16)
        """,
        job_id, line_number, raw_description, normalized_description,
        hs_code, hs_title, hs_chapter, confidence,
        risk_level, source, ai_reasoning, alternatives,
        sanctions_ofac, sanctions_un, sanctions_eu, flag_note,
    )
