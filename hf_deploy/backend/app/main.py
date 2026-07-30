import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from starlette.middleware.base import BaseHTTPMiddleware

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .models.database import init_database
from .routes import (
    upload_router, forecast_router, insights_router,
    download_router, delete_router, recommendations_router, chat_router
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting SmartSalesAI API on Hugging Face Spaces...")
    init_database()
    logger.info("Database initialized successfully.")
    yield
    logger.info("Shutting down SmartSalesAI API...")


# HF Spaces: keep docs accessible for debugging
app = FastAPI(
    title="SmartSalesAI – Sales Forecaster API",
    description="AI-powered sales forecasting using Prophet, LightGBM, and TinyLlama chatbot",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please try again later."}
    )


# HF Spaces: allow all origins (frontend is hosted separately)
allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "*")
if allowed_origins_env == "*":
    allow_all = True
    allowed_origins = ["*"]
else:
    allow_all = False
    allowed_origins = [o.strip() for o in allowed_origins_env.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=not allow_all,   # credentials=True is incompatible with wildcard
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.add_middleware(SecurityHeadersMiddleware)

app.include_router(upload_router, prefix="/api", tags=["Upload"])
app.include_router(forecast_router, prefix="/api", tags=["Forecast"])
app.include_router(insights_router, prefix="/api", tags=["Insights"])
app.include_router(download_router, prefix="/api", tags=["Download"])
app.include_router(delete_router, prefix="/api", tags=["Delete"])
app.include_router(recommendations_router, prefix="/api", tags=["AI Features"])
app.include_router(chat_router, prefix="/api", tags=["Chat"])


@app.get("/")
async def root():
    return {
        "status": "running",
        "version": "1.0.0",
        "space": "prudhvi17/smartsales-api",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
