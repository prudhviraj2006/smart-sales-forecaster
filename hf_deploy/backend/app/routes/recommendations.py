import logging
import pandas as pd
import json
from fastapi import APIRouter, HTTPException, Depends, Request
from ..models.database import get_latest_forecast
from ..models.schemas import ScenarioParams
from ..services.anomaly_detector import AnomalyDetector, RecommendationEngine, ScenarioSimulator
from ..auth import get_api_key

from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/anomalies/{job_id}")
async def get_anomalies(job_id: str, _key: str = Depends(get_api_key)):
    """Get detected anomalies for a forecast"""
    try:
        forecast = get_latest_forecast(job_id)
        if not forecast:
            raise HTTPException(status_code=404, detail="Forecast not found")

        historical_data = forecast['historical_data']
        anomalies = AnomalyDetector.detect_anomalies(
            pd.DataFrame(historical_data),
            value_column='actual'
        )

        return {
            'job_id': job_id,
            'anomalies': anomalies,
            'count': len(anomalies)
        }
    except HTTPException:
        raise
    except Exception as e:
        # --- Fix H-4: Generic error ---
        logger.error(f"Error detecting anomalies: {str(e)}")
        raise HTTPException(status_code=500, detail="Error detecting anomalies.")


@router.get("/recommendations/{job_id}")
async def get_recommendations(job_id: str, _key: str = Depends(get_api_key)):
    """Get AI recommendations for revenue optimization"""
    try:
        forecast = get_latest_forecast(job_id)
        if not forecast:
            raise HTTPException(status_code=404, detail="Forecast not found")

        forecast_data = forecast['forecast_data']
        historical_data = forecast['historical_data']
        feature_importance = forecast['feature_importance']

        recommendations = RecommendationEngine.generate_recommendations(
            forecast_data,
            historical_data,
            feature_importance
        )

        return {
            'job_id': job_id,
            'recommendations': recommendations,
            'count': len(recommendations)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating recommendations.")


# --- Fix H-8: Use ScenarioParams Pydantic model instead of raw dict ---
@router.post("/scenario/{job_id}")
@limiter.limit("10/minute")
async def run_scenario(request: Request, job_id: str, scenario_params: ScenarioParams, _key: str = Depends(get_api_key)):
    """Simulate forecast with parameter changes"""
    try:
        forecast = get_latest_forecast(job_id)
        if not forecast:
            raise HTTPException(status_code=404, detail="Forecast not found")

        forecast_data = forecast['forecast_data']

        result = ScenarioSimulator.simulate_scenario(
            forecast_data,
            scenario_params.model_dump()
        )

        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error simulating scenario: {str(e)}")
        raise HTTPException(status_code=500, detail="Error simulating scenario.")
