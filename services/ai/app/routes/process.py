import asyncio
from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from app.config import settings
from app.services.extractor import SUPPORTED_IMAGE_TYPES
from app.services.processor import process_document_job

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"application/pdf"} | set(SUPPORTED_IMAGE_TYPES.keys())
MB = 1024 * 1024


@router.post("/process/{job_id}", status_code=202)
async def process(
    job_id: str,
    file: UploadFile = File(...),
    language: str = Form(default="en"),
) -> dict:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=422, detail="Unsupported file type. Accepted: PDF, JPEG, PNG, WebP")

    file_bytes = await file.read()
    if len(file_bytes) > settings.max_file_size_mb * MB:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.max_file_size_mb}MB limit")

    if language not in ("en", "ar"):
        raise HTTPException(status_code=422, detail="language must be 'en' or 'ar'")

    # Fire and forget — Node polls job status via DB
    asyncio.create_task(
        process_document_job(job_id, file_bytes, file.content_type or "application/pdf", language)
    )

    return {"jobId": job_id, "status": "processing"}
