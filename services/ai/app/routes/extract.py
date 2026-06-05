from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from app.config import settings
from app.schemas.extract import ExtractResponse
from app.services.extractor import extract_line_items, ExtractionError, SUPPORTED_IMAGE_TYPES

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"application/pdf"} | set(SUPPORTED_IMAGE_TYPES.keys())
MB = 1024 * 1024


@router.post("/extract", response_model=ExtractResponse)
async def extract(
    file: UploadFile = File(...),
    language: str = Form(default="en"),
) -> ExtractResponse:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type. Accepted: PDF, JPEG, PNG, WebP",
        )

    file_bytes = await file.read()
    if len(file_bytes) > settings.max_file_size_mb * MB:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds {settings.max_file_size_mb}MB limit",
        )

    if language not in ("en", "ar"):
        raise HTTPException(status_code=422, detail="language must be 'en' or 'ar'")

    try:
        return await extract_line_items(file_bytes, file.content_type or "application/pdf", language)
    except ExtractionError as e:
        raise HTTPException(status_code=e.status_code, detail=e.args[0])
