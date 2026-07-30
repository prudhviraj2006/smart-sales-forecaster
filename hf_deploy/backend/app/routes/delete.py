import os
import logging
from fastapi import APIRouter, HTTPException, Depends
from ..models.database import get_connection, get_job
from ..auth import get_api_key

logger = logging.getLogger(__name__)
router = APIRouter()

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "uploads")


@router.delete("/job/{job_id}")
async def delete_job(job_id: str, _key: str = Depends(get_api_key)):
    """Delete a job and all its associated data (forecasts, uploads)"""
    try:
        # --- Fix M-2: Also delete the uploaded file from filesystem ---
        job = get_job(job_id)
        if job and job.get('file_path'):
            file_path = job['file_path']
            # Ensure file_path is within UPLOAD_DIR before deleting
            resolved = os.path.realpath(file_path)
            resolved_upload = os.path.realpath(UPLOAD_DIR)
            if resolved.startswith(resolved_upload) and os.path.exists(resolved):
                os.remove(resolved)
                logger.info(f"Deleted uploaded file: {file_path}")

        with get_connection() as conn:
            cursor = conn.cursor()

            # Delete forecast data
            cursor.execute("DELETE FROM forecasts WHERE job_id = ?", (job_id,))

            # Delete insights data
            cursor.execute("DELETE FROM insights WHERE job_id = ?", (job_id,))

            # Delete job
            cursor.execute("DELETE FROM jobs WHERE job_id = ?", (job_id,))

            conn.commit()

        logger.info(f"Deleted job {job_id} and all associated data")
        return {"status": "success", "message": f"Job {job_id} deleted"}

    except Exception as e:
        # --- Fix H-4: Generic error message ---
        logger.error(f"Error deleting job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete job.")
