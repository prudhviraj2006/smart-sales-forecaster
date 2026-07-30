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

# --- Fix M-1: Rate limiter ---
limiter = Limiter(key_func=get_remote_address)


# --- Fix M-6: Security headers middleware ---
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI Sales Forecaster API...")
    init_database()
    logger.info("Database initialized")
    yield
    logger.info("Shutting down AI Sales Forecaster API...")


# --- Fix M-4: Disable docs in production ---
is_production = os.environ.get("ENVIRONMENT", "development") == "production"

app = FastAPI(
    title="AI Sales Forecaster & Business Insight Generator",
    description="Production-capable API for sales forecasting using Prophet and LightGBM models",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None if is_production else "/docs",
    redoc_url=None if is_production else "/redoc",
    openapi_url=None if is_production else "/openapi.json",
)

# Rate limiter state
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please try again later."}
    )


# --- Fix C-2: Explicit CORS origins instead of wildcard ---
allowed_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key"],
)

app.add_middleware(SecurityHeadersMiddleware)

app.include_router(upload_router, prefix="/api", tags=["Upload"])
app.include_router(forecast_router, prefix="/api", tags=["Forecast"])
app.include_router(insights_router, prefix="/api", tags=["Insights"])
app.include_router(download_router, prefix="/api", tags=["Download"])
app.include_router(delete_router, prefix="/api", tags=["Delete"])
app.include_router(recommendations_router, prefix="/api", tags=["AI Features"])
app.include_router(chat_router, prefix="/api", tags=["Chat"])


# --- Fix M-5: Root endpoint no longer reveals API map ---
@app.get("/")
async def root():
    return {"status": "running", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
