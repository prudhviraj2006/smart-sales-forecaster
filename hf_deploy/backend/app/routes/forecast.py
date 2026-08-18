import os
import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional, Any
import logging

from ..models.schemas import (
    ForecastRequest, ForecastResponse, ModelType, AggregationType
)
from ..models.database import (
    get_job, update_job_status, save_forecast, get_latest_forecast,
    try_set_job_processing
)
from ..services.data_pipeline import DataPipeline, read_csv_safely
from ..services.forecaster import Forecaster
from ..auth import get_api_key

from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)


def clean_nan_inf(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: clean_nan_inf(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nan_inf(item) for item in obj]
    elif isinstance(obj, float):
        if np.isnan(obj) or np.isinf(obj):
            return 0.0
        return obj
    return obj


@router.post("/forecast", response_model=ForecastResponse)
@limiter.limit("3/minute")
async def run_forecast(request: Request, payload: ForecastRequest, _key: str = Depends(get_api_key)):
    job = get_job(payload.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    if not os.path.exists(job['file_path']):
        raise HTTPException(status_code=404, detail="Data file not found")
    if not try_set_job_processing(payload.job_id):
        raise HTTPException(status_code=409, detail="Job is already being processed.")

    try:
        try:
            df = read_csv_safely(job['file_path'])
        except Exception as e:
            logger.error(f"Failed reading file {job['file_path']}: {e}")
            raise HTTPException(status_code=400, detail="Unable to parse CSV file. Please check file format.")

        pipeline = DataPipeline(df)
        processed_df = pipeline.prepare_for_modeling(
            aggregation=payload.aggregation, target_column=payload.target_column, group_by=payload.group_by
        )
        if payload.target_column not in processed_df.columns:
            raise HTTPException(status_code=400, detail=f"Target column '{payload.target_column}' not found")

        forecaster = Forecaster(processed_df, payload.target_column)
        results = forecaster.forecast(model_type=payload.model, horizon=payload.horizon, aggregation=payload.aggregation)

        top_products, top_regions = None, None
        if 'product_name' in df.columns or 'product_id' in df.columns:
            pcol = 'product_name' if 'product_name' in df.columns else 'product_id'
            top_products = pipeline.get_top_by_column(df, pcol, payload.target_column, n=5)
        if 'region' in df.columns:
            top_regions = pipeline.get_top_by_column(df, 'region', payload.target_column, n=5)

        save_forecast(
            job_id=payload.job_id, model_type=payload.model.value, aggregation=payload.aggregation.value,
            horizon=payload.horizon, target_column=payload.target_column, group_by=payload.group_by,
            metrics=results['metrics'].model_dump(),
            forecast_data=[f.model_dump() for f in results['forecast']],
            historical_data=[h.model_dump() for h in results['historical']],
            decomposition_data=results['decomposition'].model_dump() if results['decomposition'] else None,
            feature_importance=[fi.model_dump() for fi in results['feature_importance']] if results['feature_importance'] else None,
            top_products=top_products, top_regions=top_regions
        )
        update_job_status(payload.job_id, 'completed')

        return ForecastResponse(
            job_id=payload.job_id, model_type=payload.model.value, aggregation=payload.aggregation.value,
            horizon=payload.horizon, target_column=payload.target_column,
            metrics=clean_nan_inf(results['metrics'].model_dump()),
            forecast=clean_nan_inf([f.model_dump() for f in results['forecast']]),
            historical=clean_nan_inf([h.model_dump() for h in results['historical']]),
            decomposition=clean_nan_inf(results['decomposition'].model_dump()) if results['decomposition'] else None,
            feature_importance=clean_nan_inf([fi.model_dump() for fi in results['feature_importance']]) if results['feature_importance'] else None,
            top_products=top_products, top_regions=top_regions
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Forecast error: {str(e)}")
        update_job_status(payload.job_id, 'error')
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")


@router.get("/forecast/{job_id}")
async def get_forecast(job_id: str, _key: str = Depends(get_api_key)):
    forecast = get_latest_forecast(job_id)
    if not forecast:
        raise HTTPException(status_code=404, detail="No forecast found for this job")
    return {
        'job_id': job_id, 'model_type': forecast['model_type'],
        'aggregation': forecast['aggregation'], 'horizon': forecast['horizon'],
        'target_column': forecast['target_column'], 'metrics': forecast['metrics'],
        'forecast': forecast['forecast_data'], 'historical': forecast['historical_data'],
        'decomposition': forecast['decomposition_data'], 'feature_importance': forecast['feature_importance'],
        'top_products': forecast['top_products'], 'top_regions': forecast['top_regions'],
        'created_at': forecast['created_at']
    }
