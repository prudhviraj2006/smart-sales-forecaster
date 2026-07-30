-- Supabase SQL Schema for Smart Sales Forecaster

-- 1. Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    job_id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'uploaded',
    file_path TEXT,
    original_filename TEXT,
    row_count INTEGER,
    column_count INTEGER,
    columns JSONB,
    date_range JSONB,
    validation_result JSONB
);

-- 2. Forecasts Table
CREATE TABLE IF NOT EXISTS forecasts (
    id BIGSERIAL PRIMARY KEY,
    job_id TEXT NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    model_type TEXT,
    aggregation TEXT,
    horizon INTEGER,
    target_column TEXT,
    group_by TEXT,
    metrics JSONB,
    forecast_data JSONB,
    historical_data JSONB,
    decomposition_data JSONB,
    feature_importance JSONB,
    top_products JSONB,
    top_regions JSONB
);

-- 3. Insights Table
CREATE TABLE IF NOT EXISTS insights (
    id BIGSERIAL PRIMARY KEY,
    job_id TEXT NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT,
    summary TEXT,
    kpis JSONB,
    bullets JSONB,
    recommendations JSONB
);

-- Create Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_forecasts_job_id ON forecasts(job_id);
CREATE INDEX IF NOT EXISTS idx_insights_job_id ON insights(job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
