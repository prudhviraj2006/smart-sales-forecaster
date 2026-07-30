import sqlite3
import json
import os
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from contextlib import contextmanager
import logging

logger = logging.getLogger(__name__)

DATABASE_PATH = os.environ.get("DATABASE_PATH", "data/forecaster.db")

# --- Fix M-3: Validate database path stays within app directory ---
_resolved_db_path = os.path.realpath(DATABASE_PATH)
_allowed_base = os.path.realpath(os.getcwd())
if not _resolved_db_path.startswith(_allowed_base):
    logger.warning("DATABASE_PATH resolves outside app directory. Falling back to default.")
    DATABASE_PATH = "data/forecaster.db"

# --- Auto Load .env File ---
from pathlib import Path
_env_path = Path(__file__).resolve().parent.parent.parent.parent / '.env'
if _env_path.exists():
    for _line in _env_path.read_text().splitlines():
        _line = _line.strip()
        if _line and not _line.startswith('#') and '=' in _line:
            _k, _v = _line.split('=', 1)
            os.environ.setdefault(_k.strip(), _v.strip())

# --- Supabase Client Setup ---
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", os.environ.get("SUPABASE_SERVICE_ROLE_KEY", os.environ.get("SUPABASE_ANON_KEY", "")))

supabase_client = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")


def init_database():
    os.makedirs(os.path.dirname(DATABASE_PATH) or '.', exist_ok=True)

    with get_connection() as conn:
        cursor = conn.cursor()

        # --- Fix L-1: Enable WAL mode for better concurrent access ---
        cursor.execute("PRAGMA journal_mode=WAL")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                job_id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                file_path TEXT,
                original_filename TEXT,
                row_count INTEGER,
                column_count INTEGER,
                columns TEXT,
                date_range TEXT,
                validation_result TEXT
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS forecasts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                model_type TEXT,
                aggregation TEXT,
                horizon INTEGER,
                target_column TEXT,
                group_by TEXT,
                metrics TEXT,
                forecast_data TEXT,
                historical_data TEXT,
                decomposition_data TEXT,
                feature_importance TEXT,
                top_products TEXT,
                top_regions TEXT,
                FOREIGN KEY (job_id) REFERENCES jobs(job_id)
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS insights (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                title TEXT,
                summary TEXT,
                kpis TEXT,
                bullets TEXT,
                recommendations TEXT,
                FOREIGN KEY (job_id) REFERENCES jobs(job_id)
            )
        """)

        conn.commit()


@contextmanager
def get_connection():
    conn = sqlite3.connect(DATABASE_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    try:
        yield conn
    finally:
        conn.close()


def create_job(job_id: str, file_path: str, original_filename: str,
               row_count: int, column_count: int, columns: List[str],
               date_range: Dict, validation_result: Dict) -> None:
    now = datetime.now(timezone.utc).isoformat()

    # Local SQLite
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO jobs (job_id, created_at, updated_at, status, file_path,
                            original_filename, row_count, column_count, columns,
                            date_range, validation_result)
            VALUES (?, ?, ?, 'uploaded', ?, ?, ?, ?, ?, ?, ?)
        """, (
            job_id, now, now, file_path, original_filename,
            row_count, column_count, json.dumps(columns),
            json.dumps(date_range), json.dumps(validation_result)
        ))
        conn.commit()

    # Supabase Cloud Sync
    if supabase_client:
        try:
            supabase_client.table("jobs").insert({
                "job_id": job_id,
                "created_at": now,
                "updated_at": now,
                "status": "uploaded",
                "file_path": file_path,
                "original_filename": original_filename,
                "row_count": row_count,
                "column_count": column_count,
                "columns": columns,
                "date_range": date_range,
                "validation_result": validation_result
            }).execute()
        except Exception as e:
            logger.error(f"Supabase create_job error: {e}")


def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    # Try Supabase first if available
    if supabase_client:
        try:
            res = supabase_client.table("jobs").select("*").eq("job_id", job_id).execute()
            if res.data and len(res.data) > 0:
                job = res.data[0]
                if isinstance(job.get('columns'), str):
                    job['columns'] = json.loads(job['columns'])
                if isinstance(job.get('date_range'), str):
                    job['date_range'] = json.loads(job['date_range'])
                if isinstance(job.get('validation_result'), str):
                    job['validation_result'] = json.loads(job['validation_result'])
                return job
        except Exception as e:
            logger.error(f"Supabase get_job error: {e}")

    # Fallback to local SQLite
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
        row = cursor.fetchone()

        if row:
            job = dict(row)
            job['columns'] = json.loads(job['columns']) if job['columns'] else []
            job['date_range'] = json.loads(job['date_range']) if job['date_range'] else {}
            job['validation_result'] = json.loads(job['validation_result']) if job['validation_result'] else {}
            return job
        return None


def get_job_safe(job_id: str) -> Optional[Dict[str, Any]]:
    job = get_job(job_id)
    if job:
        job.pop('file_path', None)
    return job


def update_job_status(job_id: str, status: str) -> None:
    now = datetime.now(timezone.utc).isoformat()

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE jobs SET status = ?, updated_at = ? WHERE job_id = ?
        """, (status, now, job_id))
        conn.commit()

    if supabase_client:
        try:
            supabase_client.table("jobs").update({
                "status": status,
                "updated_at": now
            }).eq("job_id", job_id).execute()
        except Exception as e:
            logger.error(f"Supabase update_job_status error: {e}")


def try_set_job_processing(job_id: str) -> bool:
    now = datetime.now(timezone.utc).isoformat()

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE jobs SET status = 'processing', updated_at = ?
            WHERE job_id = ? AND status != 'processing'
        """, (now, job_id))
        conn.commit()
        success = cursor.rowcount > 0

    if supabase_client and success:
        try:
            supabase_client.table("jobs").update({
                "status": "processing",
                "updated_at": now
            }).eq("job_id", job_id).execute()
        except Exception as e:
            logger.error(f"Supabase try_set_job_processing error: {e}")

    return success


def save_forecast(job_id: str, model_type: str, aggregation: str,
                  horizon: int, target_column: str, group_by: Optional[str],
                  metrics: Dict, forecast_data: List, historical_data: List,
                  decomposition_data: Optional[Dict], feature_importance: Optional[List],
                  top_products: Optional[List], top_regions: Optional[List]) -> int:
    now = datetime.now(timezone.utc).isoformat()

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO forecasts (job_id, created_at, model_type, aggregation,
                                  horizon, target_column, group_by, metrics,
                                  forecast_data, historical_data, decomposition_data,
                                  feature_importance, top_products, top_regions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            job_id, now, model_type, aggregation, horizon, target_column, group_by,
            json.dumps(metrics), json.dumps(forecast_data), json.dumps(historical_data),
            json.dumps(decomposition_data) if decomposition_data else None,
            json.dumps(feature_importance) if feature_importance else None,
            json.dumps(top_products) if top_products else None,
            json.dumps(top_regions) if top_regions else None
        ))
        conn.commit()
        last_id = cursor.lastrowid

    if supabase_client:
        try:
            supabase_client.table("forecasts").insert({
                "job_id": job_id,
                "created_at": now,
                "model_type": model_type,
                "aggregation": aggregation,
                "horizon": horizon,
                "target_column": target_column,
                "group_by": group_by,
                "metrics": metrics,
                "forecast_data": forecast_data,
                "historical_data": historical_data,
                "decomposition_data": decomposition_data,
                "feature_importance": feature_importance,
                "top_products": top_products,
                "top_regions": top_regions
            }).execute()
        except Exception as e:
            logger.error(f"Supabase save_forecast error: {e}")

    return last_id


def get_latest_forecast(job_id: str) -> Optional[Dict[str, Any]]:
    if supabase_client:
        try:
            res = supabase_client.table("forecasts").select("*").eq("job_id", job_id).order("created_at", desc=True).limit(1).execute()
            if res.data and len(res.data) > 0:
                forecast = res.data[0]
                for key in ['metrics', 'forecast_data', 'historical_data', 'decomposition_data', 'feature_importance', 'top_products', 'top_regions']:
                    if isinstance(forecast.get(key), str):
                        forecast[key] = json.loads(forecast[key])
                return forecast
        except Exception as e:
            logger.error(f"Supabase get_latest_forecast error: {e}")

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM forecasts WHERE job_id = ? ORDER BY created_at DESC LIMIT 1
        """, (job_id,))
        row = cursor.fetchone()

        if row:
            forecast = dict(row)
            forecast['metrics'] = json.loads(forecast['metrics']) if forecast['metrics'] else {}
            forecast['forecast_data'] = json.loads(forecast['forecast_data']) if forecast['forecast_data'] else []
            forecast['historical_data'] = json.loads(forecast['historical_data']) if forecast['historical_data'] else []
            forecast['decomposition_data'] = json.loads(forecast['decomposition_data']) if forecast['decomposition_data'] else None
            forecast['feature_importance'] = json.loads(forecast['feature_importance']) if forecast['feature_importance'] else None
            forecast['top_products'] = json.loads(forecast['top_products']) if forecast['top_products'] else None
            forecast['top_regions'] = json.loads(forecast['top_regions']) if forecast['top_regions'] else None
            return forecast
        return None


def save_insights(job_id: str, title: str, summary: str,
                  kpis: List, bullets: List, recommendations: List) -> int:
    now = datetime.now(timezone.utc).isoformat()

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO insights (job_id, created_at, title, summary, kpis, bullets, recommendations)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            job_id, now, title, summary,
            json.dumps(kpis), json.dumps(bullets), json.dumps(recommendations)
        ))
        conn.commit()
        last_id = cursor.lastrowid

    if supabase_client:
        try:
            supabase_client.table("insights").insert({
                "job_id": job_id,
                "created_at": now,
                "title": title,
                "summary": summary,
                "kpis": kpis,
                "bullets": bullets,
                "recommendations": recommendations
            }).execute()
        except Exception as e:
            logger.error(f"Supabase save_insights error: {e}")

    return last_id


def get_latest_insights(job_id: str) -> Optional[Dict[str, Any]]:
    if supabase_client:
        try:
            res = supabase_client.table("insights").select("*").eq("job_id", job_id).order("created_at", desc=True).limit(1).execute()
            if res.data and len(res.data) > 0:
                insights = res.data[0]
                for key in ['kpis', 'bullets', 'recommendations']:
                    if isinstance(insights.get(key), str):
                        insights[key] = json.loads(insights[key])
                return insights
        except Exception as e:
            logger.error(f"Supabase get_latest_insights error: {e}")

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM insights WHERE job_id = ? ORDER BY created_at DESC LIMIT 1
        """, (job_id,))
        row = cursor.fetchone()

        if row:
            insights = dict(row)
            insights['kpis'] = json.loads(insights['kpis']) if insights['kpis'] else []
            insights['bullets'] = json.loads(insights['bullets']) if insights['bullets'] else []
            insights['recommendations'] = json.loads(insights['recommendations']) if insights['recommendations'] else []
            return insights
        return None


def get_recent_jobs(limit: int = 10) -> List[Dict[str, Any]]:
    if supabase_client:
        try:
            res = supabase_client.table("jobs").select("*").order("created_at", desc=True).limit(limit).execute()
            if res.data:
                jobs_list = []
                for job in res.data:
                    j = dict(job)
                    fc_res = supabase_client.table("forecasts").select("model_type, aggregation, horizon, target_column, created_at").eq("job_id", j["job_id"]).order("created_at", desc=True).limit(1).execute()
                    if fc_res.data and len(fc_res.data) > 0:
                        fc = fc_res.data[0]
                        j['model_type'] = fc.get('model_type')
                        j['aggregation'] = fc.get('aggregation')
                        j['horizon'] = fc.get('horizon')
                        j['target_column'] = fc.get('target_column')
                        j['forecast_created_at'] = fc.get('created_at')
                        j['has_forecast'] = True
                    else:
                        j['has_forecast'] = False
                    jobs_list.append(j)
                return jobs_list
        except Exception as e:
            logger.error(f"Supabase get_recent_jobs error: {e}")

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT j.job_id, j.created_at, j.original_filename, j.row_count,
                   j.column_count, j.status,
                   f.model_type, f.aggregation, f.horizon, f.target_column,
                   f.created_at as forecast_created_at
            FROM jobs j
            LEFT JOIN (
                SELECT job_id, model_type, aggregation, horizon, target_column, created_at,
                       ROW_NUMBER() OVER (PARTITION BY job_id ORDER BY created_at DESC) as rn
                FROM forecasts
            ) f ON j.job_id = f.job_id AND f.rn = 1
            ORDER BY j.created_at DESC
            LIMIT ?
        """, (limit,))

        rows = cursor.fetchall()
        result = []

        for row in rows:
            job = dict(row)
            job['has_forecast'] = job.get('model_type') is not None
            result.append(job)

        return result


def get_job_with_forecast(job_id: str) -> Optional[Dict[str, Any]]:
    job = get_job(job_id)
    if not job:
        return None

    forecast = get_latest_forecast(job_id)
    insights = get_latest_insights(job_id)

    return {
        'job': job,
        'forecast': forecast,
        'insights': insights
    }
