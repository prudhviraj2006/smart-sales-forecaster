import os
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
from typing import List
import logging

from ..models.schemas import UploadResponse, ValidationResult
from ..models.database import create_job, get_job, get_job_safe, get_recent_jobs, get_job_with_forecast
from ..services.data_pipeline import DataPipeline, read_csv_safely
from ..utils.helpers import generate_job_id
from ..auth import get_api_key

from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

# --- Fix C-4 / H-2: Validate and sanitize UPLOAD_DIR ---
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "uploads")
_resolved_upload_dir = os.path.realpath(UPLOAD_DIR)
_allowed_base = os.path.realpath(os.getcwd())
if not _resolved_upload_dir.startswith(_allowed_base):
    logger.warning("UPLOAD_DIR resolves outside app directory. Falling back to default.")
    UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- Fix C-4: File size limit (10MB) ---
MAX_UPLOAD_SIZE = 10 * 1024 * 1024


@router.post("/upload", response_model=UploadResponse)
@limiter.limit("5/minute")
async def upload_csv(request: Request, file: UploadFile = File(...), _key: str = Depends(get_api_key)):
    # --- Fix H-1: Validate filename extension ---
    if not file.filename or not file.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    # --- Fix H-1: Validate content type ---
    if file.content_type and file.content_type not in ('text/csv', 'application/csv', 'application/vnd.ms-excel', 'application/octet-stream'):
        raise HTTPException(status_code=400, detail="Invalid file content type")

    try:
        # --- Fix C-4: Enforce file size limit by reading in chunks ---
        contents = bytearray()
        while True:
            chunk = await file.read(8192)
            if not chunk:
                break
            contents.extend(chunk)
            if len(contents) > MAX_UPLOAD_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail=f"File too large. Maximum size is {MAX_UPLOAD_SIZE // (1024*1024)}MB."
                )
        contents = bytes(contents)

        try:
            df = read_csv_safely(contents)
        except Exception as e:
            logger.error(f"CSV parsing error: {str(e)}")
            raise HTTPException(status_code=400, detail="Error parsing CSV file. Please check the file format.")

        if len(df) == 0:
            raise HTTPException(status_code=400, detail="CSV file is empty")

        job_id = generate_job_id()

        file_path = os.path.join(UPLOAD_DIR, f"{job_id}.csv")
        with open(file_path, 'wb') as f:
            f.write(contents)

        pipeline = DataPipeline(df)
        validation_result = pipeline.validate()

        all_columns, numeric_columns, categorical_columns = pipeline.get_column_info()
        preview = pipeline.get_preview(n=10)

        date_range = validation_result.date_range or {}

        create_job(
            job_id=job_id,
            file_path=file_path,
            original_filename=file.filename,
            row_count=validation_result.row_count,
            column_count=validation_result.column_count,
            columns=all_columns,
            date_range=date_range,
            validation_result=validation_result.model_dump()
        )

        return UploadResponse(
            job_id=job_id,
            validation=validation_result,
            preview=preview,
            columns=all_columns,
            numeric_columns=numeric_columns,
            categorical_columns=categorical_columns
        )

    except HTTPException:
        raise
    except Exception as e:
        # --- Fix H-4: Don't leak internal error details ---
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="An internal error occurred while processing the file.")


# --- Fix H-6: Use get_job_safe to hide file_path from response ---
@router.get("/job/{job_id}")
async def get_job_info(job_id: str, _key: str = Depends(get_api_key)):
    job = get_job_safe(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/recent-jobs")
async def get_recent_jobs_list(limit: int = 10, _key: str = Depends(get_api_key)):
    jobs = get_recent_jobs(limit=min(limit, 50))
    return {"jobs": jobs}


@router.get("/job/{job_id}/full")
async def get_job_full_data(job_id: str, _key: str = Depends(get_api_key)):
    data = get_job_with_forecast(job_id)
    if not data:
        raise HTTPException(status_code=404, detail="Job not found")
    # --- Fix H-6: Strip file_path from response ---
    if data.get('job'):
        data['job'].pop('file_path', None)
    return data
