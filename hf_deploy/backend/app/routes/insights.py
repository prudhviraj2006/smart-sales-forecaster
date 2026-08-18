import os
import pandas as pd
from fastapi import APIRouter, HTTPException, Query, Depends
import logging

from ..models.schemas import InsightsResponse, ForecastMetrics, FeatureImportance
from ..models.database import get_job, get_latest_forecast, save_insights, get_latest_insights
from ..services.insights_generator import InsightsGenerator
from ..services.data_pipeline import read_csv_safely
from ..auth import get_api_key

router = APIRouter()
logger = logging.getLogger(__name__)


def _load_and_prepare_df(job):
    """Load CSV and prepare DataFrame for insights generation."""
    try:
        df = read_csv_safely(job['file_path'])
    except Exception as e:
        logger.error(f"Error loading file for insights {job['file_path']}: {e}")
        raise HTTPException(status_code=500, detail="Unable to read data file.")

    df.columns = [c.strip() for c in df.columns]
    date_candidates = [c for c in df.columns if c.lower() in ['date', 'timestamp', 'time', 'period']]
    if date_candidates and 'date' not in df.columns:
        df = df.rename(columns={date_candidates[0]: 'date'})
    if 'date' not in df.columns:
        raise HTTPException(status_code=400, detail="Missing required date column in the data")

    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    df = df.dropna(subset=['date'])
    if len(df) == 0:
        raise HTTPException(status_code=400, detail="No valid dates found in the data")
    if 'month' not in df.columns:
        df['month'] = df['date'].dt.month
    return df


def _build_generator(df, forecast):
    metrics = ForecastMetrics(**forecast['metrics'])
    feature_importance = None
    if forecast['feature_importance']:
        feature_importance = [FeatureImportance(**fi) for fi in forecast['feature_importance']]
    return InsightsGenerator(
        historical_df=df, forecast_data=forecast['forecast_data'],
        metrics=metrics, target_column=forecast['target_column'],
        feature_importance=feature_importance
    )


@router.get("/insights", response_model=InsightsResponse)
async def get_insights(job_id: str = Query(...), _key: str = Depends(get_api_key)):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    forecast = get_latest_forecast(job_id)
    if not forecast:
        raise HTTPException(status_code=404, detail="No forecast found. Please run a forecast first.")

    try:
        existing = get_latest_insights(job_id)
        if existing:
            return InsightsResponse(
                job_id=job_id, title=existing['title'], summary=existing['summary'],
                kpis=existing['kpis'], bullets=existing['bullets'],
                recommendations=existing['recommendations'], generated_at=existing['created_at']
            )

        df = _load_and_prepare_df(job)
        generator = _build_generator(df, forecast)
        insights = generator.generate_insights()

        save_insights(job_id=job_id, title=insights['title'], summary=insights['summary'],
                      kpis=insights['kpis'], bullets=insights['bullets'],
                      recommendations=insights['recommendations'])

        return InsightsResponse(job_id=job_id, **insights)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Insights generation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating insights.")


@router.post("/insights/regenerate")
async def regenerate_insights(job_id: str = Query(...), _key: str = Depends(get_api_key)):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    forecast = get_latest_forecast(job_id)
    if not forecast:
        raise HTTPException(status_code=404, detail="No forecast found")

    try:
        df = _load_and_prepare_df(job)
        generator = _build_generator(df, forecast)
        insights = generator.generate_insights()

        save_insights(job_id=job_id, title=insights['title'], summary=insights['summary'],
                      kpis=insights['kpis'], bullets=insights['bullets'],
                      recommendations=insights['recommendations'])

        return InsightsResponse(job_id=job_id, **insights)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Insights regeneration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error regenerating insights.")
