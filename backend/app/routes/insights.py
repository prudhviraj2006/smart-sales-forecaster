import os
import pandas as pd
from fastapi import APIRouter, HTTPException, Query
import logging

from ..models.schemas import InsightsResponse, ForecastMetrics, FeatureImportance
from ..models.database import (
    get_job, get_latest_forecast, save_insights, get_latest_insights
)
from ..services.insights_generator import InsightsGenerator

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/insights", response_model=InsightsResponse)
async def get_insights(job_id: str = Query(..., description="Job ID from forecast")):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    forecast = get_latest_forecast(job_id)
    if not forecast:
        raise HTTPException(
            status_code=404, 
            detail="No forecast found. Please run a forecast first."
        )
    
    try:
        existing_insights = get_latest_insights(job_id)
        if existing_insights:
            return InsightsResponse(
                job_id=job_id,
                title=existing_insights['title'],
                summary=existing_insights['summary'],
                kpis=existing_insights['kpis'],
                bullets=existing_insights['bullets'],
                recommendations=existing_insights['recommendations'],
                generated_at=existing_insights['created_at']
            )
        
        # Read CSV with encoding detection
        encodings_to_try = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252', 'iso-8859-1']
        df = None
        for encoding in encodings_to_try:
            try:
                df = pd.read_csv(job['file_path'], encoding=encoding)
                logger.info(f"Successfully read CSV for insights with encoding: {encoding}")
                break
            except UnicodeDecodeError:
                continue
        
        if df is None:
            raise HTTPException(status_code=500, detail="Unable to read data file with any supported encoding")
            
        # Normalize column names (lowercase)
        df.columns = [c.strip() for c in df.columns]
        
        # Handle date column renaming if needed
        date_candidates = [c for c in df.columns if c.lower() in ['date', 'timestamp', 'time', 'period']]
        if date_candidates and 'date' not in df.columns:
            df = df.rename(columns={date_candidates[0]: 'date'})
            logger.info(f"Renamed column '{date_candidates[0]}' to 'date' for insights")
            
        if 'date' not in df.columns:
             raise HTTPException(status_code=400, detail="Missing required date column in the data")

        # Robust date parsing
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        
        # Drop rows with invalid dates
        invalid_count = df['date'].isna().sum()
        if invalid_count > 0:
            logger.warning(f"Dropped {invalid_count} rows with invalid dates for insights")
            df = df.dropna(subset=['date'])
            
        if len(df) == 0:
             raise HTTPException(status_code=400, detail="No valid dates found in the data")
        
        if 'month' not in df.columns:
            df['month'] = df['date'].dt.month
        
        metrics = ForecastMetrics(**forecast['metrics'])
        
        feature_importance = None
        if forecast['feature_importance']:
            feature_importance = [
                FeatureImportance(**fi) for fi in forecast['feature_importance']
            ]
        
        generator = InsightsGenerator(
            historical_df=df,
            forecast_data=forecast['forecast_data'],
            metrics=metrics,
            target_column=forecast['target_column'],
            feature_importance=feature_importance
        )
        
        insights = generator.generate_insights()
        
        save_insights(
            job_id=job_id,
            title=insights['title'],
            summary=insights['summary'],
            kpis=insights['kpis'],
            bullets=insights['bullets'],
            recommendations=insights['recommendations']
        )
        
        return InsightsResponse(
            job_id=job_id,
            **insights
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Insights generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating insights: {str(e)}")


@router.post("/insights/regenerate")
async def regenerate_insights(job_id: str = Query(...)):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    forecast = get_latest_forecast(job_id)
    if not forecast:
        raise HTTPException(status_code=404, detail="No forecast found")
    
    try:
        # Read CSV with encoding detection
        encodings_to_try = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252', 'iso-8859-1']
        df = None
        for encoding in encodings_to_try:
            try:
                df = pd.read_csv(job['file_path'], encoding=encoding)
                logger.info(f"Successfully read CSV for insights regeneration with encoding: {encoding}")
                break
            except UnicodeDecodeError:
                continue
        
        if df is None:
            raise HTTPException(status_code=500, detail="Unable to read data file with any supported encoding")
            
        # Normalize column names (lowercase)
        df.columns = [c.strip() for c in df.columns]
        
        # Handle date column renaming if needed
        date_candidates = [c for c in df.columns if c.lower() in ['date', 'timestamp', 'time', 'period']]
        if date_candidates and 'date' not in df.columns:
            df = df.rename(columns={date_candidates[0]: 'date'})
            logger.info(f"Renamed column '{date_candidates[0]}' to 'date' for insights regeneration")
            
        if 'date' not in df.columns:
             raise HTTPException(status_code=400, detail="Missing required date column in the data")

        # Robust date parsing
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        
        # Drop rows with invalid dates
        invalid_count = df['date'].isna().sum()
        if invalid_count > 0:
            logger.warning(f"Dropped {invalid_count} rows with invalid dates for insights regeneration")
            df = df.dropna(subset=['date'])
            
        if len(df) == 0:
             raise HTTPException(status_code=400, detail="No valid dates found in the data")
        
        if 'month' not in df.columns:
            df['month'] = df['date'].dt.month
        
        metrics = ForecastMetrics(**forecast['metrics'])
        
        feature_importance = None
        if forecast['feature_importance']:
            feature_importance = [
                FeatureImportance(**fi) for fi in forecast['feature_importance']
            ]
        
        generator = InsightsGenerator(
            historical_df=df,
            forecast_data=forecast['forecast_data'],
            metrics=metrics,
            target_column=forecast['target_column'],
            feature_importance=feature_importance
        )
        
        insights = generator.generate_insights()
        
        save_insights(
            job_id=job_id,
            title=insights['title'],
            summary=insights['summary'],
            kpis=insights['kpis'],
            bullets=insights['bullets'],
            recommendations=insights['recommendations']
        )
        
        return InsightsResponse(
            job_id=job_id,
            **insights
        )
        
    except Exception as e:
        logger.error(f"Insights regeneration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error regenerating insights: {str(e)}")
