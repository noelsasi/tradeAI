from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes import health, classify, extract, process
from app.services.classifier import ClassificationError
from app.services.extractor import ExtractionError
from app.infrastructure.db import close_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_pool()


app = FastAPI(title="TradeAI — AI Service", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(classify.router)
app.include_router(extract.router)
app.include_router(process.router)


@app.exception_handler(ClassificationError)
async def classification_error_handler(request: Request, exc: ClassificationError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": {"code": exc.code, "message": str(exc)}},
    )


@app.exception_handler(ExtractionError)
async def extraction_error_handler(request: Request, exc: ExtractionError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": {"code": exc.code, "message": str(exc)}},
    )
