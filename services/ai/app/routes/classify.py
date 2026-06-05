from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from app.schemas.classify import ClassifyRequest, ClassifyResponse
from app.services.classifier import classify_description, ClassificationError

router = APIRouter()


@router.post("/classify", response_model=ClassifyResponse)
async def classify(body: ClassifyRequest) -> ClassifyResponse:
    return await classify_description(
        description=body.description,
        origin_country=body.origin_country,
        quantity=body.quantity,
        unit_value=body.unit_value,
        language=body.language,
    )
