import os
import io
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime
import logging

from ..utils.holidays import get_holiday_flags
from ..models.schemas import ValidationResult, AggregationType

logger = logging.getLogger(__name__)


def read_file_safely(source: Any, filename: Optional[str] = None) -> pd.DataFrame:
    """
    Safely reads a CSV or Excel file from a file path or bytes/bytearray.
    1. Detects .xlsx / .xls files (via extension or magic bytes) and uses pd.read_excel().
    2. For CSV/text files, uses encoding detection (charset-normalizer/chardet) and fallbacks
       (utf-8 -> utf-8-sig -> cp1252 -> latin-1 -> iso-8859-1) to gracefully decode non-UTF-8 bytes (e.g. 0xd2).
    3. Returns a clean DataFrame or raises a clear actionable error message on unrecoverable decode failures.
    """
    is_excel = False
    if filename:
        fn_lower = filename.lower()
        if fn_lower.endswith('.xlsx') or fn_lower.endswith('.xls'):
            is_excel = True

    raw_bytes = None
    if isinstance(source, (bytes, bytearray)):
        raw_bytes = bytes(source)
    elif isinstance(source, str) and os.path.exists(source):
        try:
            with open(source, 'rb') as f:
                raw_bytes = f.read(1024)
        except Exception:
            pass

    if raw_bytes and (raw_bytes.startswith(b'PK\x03\x04') or raw_bytes.startswith(b'\xd0\xcf\x11\xe0')):
        is_excel = True

    # 1. Excel File Reading (.xlsx / .xls)
    if is_excel:
        try:
            if isinstance(source, (bytes, bytearray)):
                return pd.read_excel(io.BytesIO(source))
            else:
                return pd.read_excel(source)
        except Exception as e:
            logger.error(f"Excel parsing error: {e}")
            raise ValueError(f"Unable to read Excel file. Please ensure it is a valid .xlsx or .xls file. Details: {str(e)}")

    # 2. CSV / Text File Reading
    if raw_bytes is None:
        if isinstance(source, (bytes, bytearray)):
            raw_bytes = bytes(source)
        elif isinstance(source, str) and os.path.exists(source):
            try:
                with open(source, 'rb') as f:
                    raw_bytes = f.read()
            except Exception:
                pass

    encodings_to_try = ['utf-8', 'utf-8-sig', 'cp1252', 'latin-1', 'iso-8859-1', 'mac_roman']

    if raw_bytes:
        try:
            import charset_normalizer
            detected = charset_normalizer.detect(raw_bytes[:50000])
            if detected and detected.get('encoding'):
                enc_name = detected['encoding']
                if enc_name and enc_name.lower() not in [e.lower() for e in encodings_to_try]:
                    encodings_to_try.insert(0, enc_name)
        except Exception:
            try:
                import chardet
                detected = chardet.detect(raw_bytes[:50000])
                if detected and detected.get('encoding'):
                    enc_name = detected['encoding']
                    if enc_name and enc_name.lower() not in [e.lower() for e in encodings_to_try]:
                        encodings_to_try.insert(0, enc_name)
            except Exception:
                pass

    for enc in encodings_to_try:
        try:
            if isinstance(source, (bytes, bytearray)):
                return pd.read_csv(io.BytesIO(source), encoding=enc)
            else:
                return pd.read_csv(source, encoding=enc)
        except Exception:
            continue

    # Fallback with encoding_errors='replace'
    for enc in ['utf-8', 'cp1252', 'latin-1']:
        try:
            if isinstance(source, (bytes, bytearray)):
                return pd.read_csv(io.BytesIO(source), encoding=enc, encoding_errors='replace')
            else:
                return pd.read_csv(source, encoding=enc, encoding_errors='replace')
        except Exception:
            continue

    # Final string fallback
    try:
        if raw_bytes is not None:
            text = raw_bytes.decode('utf-8', errors='replace')
            return pd.read_csv(io.StringIO(text))
    except Exception:
        pass

    raise ValueError("This file isn't UTF-8 encoded. Please re-save it as UTF-8 CSV, or try again — we're attempting an alternate encoding.")


# Alias for backward compatibility
read_csv_safely = read_file_safely




class DataPipeline:
    REQUIRED_COLUMNS = ['date']
    NUMERIC_COLUMNS = ['units_sold', 'revenue', 'price']
    OPTIONAL_COLUMNS = ['product_id', 'product_name', 'region', 'promotion_flag']
    DATE_COLUMN_ALIASES = ['date', 'Date', 'datetime', 'DateTime', 'DATETIME', 'time', 'Time', 'timestamp', 'Timestamp', 'TIMESTAMP']
    
    def __init__(self, df: pd.DataFrame):
        self.raw_df = df.copy()
        self.processed_df = None
        self.validation_result = None
        self._normalize_columns()
    
    def _normalize_columns(self) -> None:
        """Auto-detect and normalize date column names"""
        for alias in self.DATE_COLUMN_ALIASES:
            if alias in self.raw_df.columns and alias != 'date':
                self.raw_df.rename(columns={alias: 'date'}, inplace=True)
                logger.info(f"Renamed column '{alias}' to 'date'")
                break
    
    def validate(self) -> ValidationResult:
        errors = []
        warnings = []
        
        missing_required = [col for col in self.REQUIRED_COLUMNS if col not in self.raw_df.columns]
        if missing_required:
            available_cols = ', '.join(self.raw_df.columns.tolist())
            errors.append(f"Missing required 'date' column. Available columns: {available_cols}")
        
        if 'date' in self.raw_df.columns:
            try:
                self.raw_df['date'] = pd.to_datetime(self.raw_df['date'], errors='coerce')
                invalid_dates = self.raw_df['date'].isna().sum()
                if invalid_dates > 0:
                    warnings.append(f"{invalid_dates} rows have invalid or missing dates")
                if self.raw_df['date'].isna().all():
                    errors.append("All date values are invalid. Please check your date column format.")
            except Exception as e:
                errors.append(f"Date parsing error: {str(e)}")
        
        numeric_present = [col for col in self.NUMERIC_COLUMNS if col in self.raw_df.columns]
        if not numeric_present:
            auto_numeric = self.raw_df.select_dtypes(include=[np.number]).columns.tolist()
            if auto_numeric:
                numeric_present = auto_numeric
                logger.info(f"Auto-detected numeric columns: {numeric_present}")
            else:
                warnings.append("No numeric columns found. You may need to specify a target column for forecasting.")
        
        for col in numeric_present:
            try:
                self.raw_df[col] = pd.to_numeric(self.raw_df[col], errors='coerce')
            except Exception:
                pass
        
        missing_values = {}
        for col in self.raw_df.columns:
            null_count = self.raw_df[col].isna().sum()
            if null_count > 0:
                missing_values[col] = int(null_count)
        
        if missing_values:
            high_missing = {k: v for k, v in missing_values.items() 
                          if v > len(self.raw_df) * 0.1}
            if high_missing:
                warnings.append(f"High missing values in: {', '.join(high_missing.keys())}")
        
        date_range = None
        if 'date' in self.raw_df.columns and not self.raw_df['date'].isna().all():
            try:
                min_date = self.raw_df['date'].min()
                max_date = self.raw_df['date'].max()
                if pd.notna(min_date) and pd.notna(max_date):
                    date_range = {
                        'start': pd.Timestamp(min_date).strftime('%Y-%m-%d'),
                        'end': pd.Timestamp(max_date).strftime('%Y-%m-%d')
                    }
            except Exception as e:
                logger.warning(f"Could not calculate date range: {str(e)}")
        
        self.validation_result = ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            row_count=len(self.raw_df),
            column_count=len(self.raw_df.columns),
            date_range=date_range,
            missing_values=missing_values
        )
        
        return self.validation_result
    
    def clean_data(self) -> pd.DataFrame:
        df = self.raw_df.copy()
        
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'], errors='coerce')
            df = df.dropna(subset=['date'])
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        for col in numeric_cols:
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)
        
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        if 'date' in categorical_cols:
            categorical_cols.remove('date')
        for col in categorical_cols:
            mode_val = df[col].mode()
            if len(mode_val) > 0:
                df[col] = df[col].fillna(mode_val[0])
        
        self.processed_df = df
        return df
    
    def handle_outliers(self, columns: List[str] = None) -> pd.DataFrame:
        if self.processed_df is None:
            self.clean_data()
        
        df = self.processed_df.copy()
        
        if columns is None:
            columns = df.select_dtypes(include=[np.number]).columns.tolist()
        
        for col in columns:
            if col in df.columns:
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                
                df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
        
        self.processed_df = df
        return df
    
    def aggregate(self, freq: AggregationType, target_column: str = 'revenue',
                  group_by: Optional[str] = None) -> pd.DataFrame:
        if self.processed_df is None:
            self.clean_data()
        
        df = self.processed_df.copy()
        df = df.sort_values('date')
        
        freq_map = {
            AggregationType.DAILY: 'D',
            AggregationType.WEEKLY: 'W',
            AggregationType.MONTHLY: 'ME'
        }
        pd_freq = freq_map.get(freq, 'ME')
        
        agg_cols = {target_column: 'sum'}
        
        if 'units_sold' in df.columns and target_column != 'units_sold':
            agg_cols['units_sold'] = 'sum'
        if 'price' in df.columns:
            agg_cols['price'] = 'mean'
        if 'promotion_flag' in df.columns:
            agg_cols['promotion_flag'] = 'max'
        
        if group_by and group_by in df.columns:
            df['period'] = df['date'].dt.to_period(pd_freq)
            aggregated = df.groupby(['period', group_by]).agg(agg_cols).reset_index()
            aggregated['date'] = aggregated['period'].dt.to_timestamp()
            aggregated = aggregated.drop(columns=['period'])
        else:
            df.set_index('date', inplace=True)
            aggregated = df.resample(pd_freq).agg(agg_cols).reset_index()
        
        return aggregated
    
    def engineer_features(self, df: pd.DataFrame, target_column: str = 'revenue') -> pd.DataFrame:
        df = df.copy()
        df = df.sort_values('date')
        
        df['year'] = df['date'].dt.year
        df['month'] = df['date'].dt.month
        df['day'] = df['date'].dt.day
        df['day_of_week'] = df['date'].dt.dayofweek
        df['week_of_year'] = df['date'].dt.isocalendar().week.astype(int)
        df['quarter'] = df['date'].dt.quarter
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
        df['is_month_start'] = df['date'].dt.is_month_start.astype(int)
        df['is_month_end'] = df['date'].dt.is_month_end.astype(int)
        
        for lag in [1, 7, 14, 30]:
            df[f'{target_column}_lag_{lag}'] = df[target_column].shift(lag)
        
        for window in [7, 14, 30]:
            df[f'{target_column}_rolling_mean_{window}'] = df[target_column].rolling(window=window, min_periods=1).mean()
            df[f'{target_column}_rolling_std_{window}'] = df[target_column].rolling(window=window, min_periods=1).std()
        
        df[f'{target_column}_diff'] = df[target_column].diff()
        df[f'{target_column}_pct_change'] = df[target_column].pct_change()
        
        if 'price' in df.columns and 'units_sold' in df.columns:
            df['price_lag_1'] = df['price'].shift(1)
            df['units_lag_1'] = df['units_sold'].shift(1)
            
            price_change = df['price'].pct_change()
            units_change = df['units_sold'].pct_change()
            
            with np.errstate(divide='ignore', invalid='ignore'):
                df['price_elasticity'] = np.where(
                    price_change != 0,
                    units_change / price_change,
                    0
                )
            df['price_elasticity'] = df['price_elasticity'].replace([np.inf, -np.inf], 0).fillna(0)
        
        try:
            holiday_flags = get_holiday_flags(df['date'])
            df = pd.concat([df.reset_index(drop=True), holiday_flags.reset_index(drop=True)], axis=1)
        except Exception as e:
            logger.warning(f"Could not add holiday flags: {e}")
            df['is_holiday'] = 0
        
        df = df.bfill().ffill().fillna(0)
        
        return df
    
    def prepare_for_modeling(self, aggregation: AggregationType, 
                             target_column: str = 'revenue',
                             group_by: Optional[str] = None) -> pd.DataFrame:
        self.clean_data()
        self.handle_outliers()
        aggregated = self.aggregate(aggregation, target_column, group_by)
        featured = self.engineer_features(aggregated, target_column)
        
        return featured
    
    def get_preview(self, n: int = 10) -> List[Dict[str, Any]]:
        df = self.raw_df.head(n).copy()
        
        for col in df.columns:
            if pd.api.types.is_datetime64_any_dtype(df[col]):
                df[col] = df[col].dt.strftime('%Y-%m-%d')
        
        return df.to_dict(orient='records')
    
    def get_column_info(self) -> Tuple[List[str], List[str], List[str]]:
        all_columns = list(self.raw_df.columns)
        numeric_columns = list(self.raw_df.select_dtypes(include=[np.number]).columns)
        categorical_columns = list(self.raw_df.select_dtypes(include=['object', 'category']).columns)
        
        return all_columns, numeric_columns, categorical_columns
    
    def get_top_by_column(self, df: pd.DataFrame, group_col: str, 
                          value_col: str, n: int = 5) -> List[Dict[str, Any]]:
        if group_col not in df.columns or value_col not in df.columns:
            return []
        
        grouped = df.groupby(group_col)[value_col].sum().reset_index()
        grouped = grouped.sort_values(value_col, ascending=False).head(n)
        
        return grouped.to_dict(orient='records')
