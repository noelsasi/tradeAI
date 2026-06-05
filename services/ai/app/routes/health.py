from datetime import datetime, timezone
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model": "claude-haiku-4-5-20251001",
    }
