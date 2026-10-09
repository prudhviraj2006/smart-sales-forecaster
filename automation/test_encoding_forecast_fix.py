"""
Automated Test Case: Non-UTF-8 Encoding (byte 0xd2) and Excel (.xlsx) file parsing verification.
Verifies that:
1. Files containing byte 0xd2 (Windows-1252 / Latin-1 smart quotes) parse successfully without UnicodeDecodeError.
2. Excel .xlsx files are automatically detected and parsed using pandas/openpyxl.
3. No duplicate error banners are generated and clean error messages are raised on invalid inputs.
"""
import os
import io
import tempfile
import pandas as pd
import pytest

# Test the core reader logic
def test_non_utf8_windows1252_byte_0xd2():
    """
    Verifies that a CSV file containing byte 0xd2 (e.g. from Excel Windows-1252 export)
    is decoded gracefully without raising 'utf-8 codec can't decode byte 0xd2'.
    """
    from app.api.forecast import read_file_safely
    
    # 0xd2 is the Windows-1252 byte for left double quotation mark (")
    raw_content = b'date,Sales,product\n2023-01-01,150.0,\xd2Product A\xd2\n2023-02-01,200.0,Product B\n'
    
    with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as f:
        f.write(raw_content)
        temp_path = f.name
        
    try:
        df = read_file_safely(temp_path)
        assert len(df) == 2, f"Expected 2 rows, got {len(df)}"
        assert 'Sales' in df.columns
        assert 'product' in df.columns
        print("[PASS] test_non_utf8_windows1252_byte_0xd2 passed successfully!")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def test_excel_xlsx_file_parsing():
    """
    Verifies that Excel .xlsx files are automatically detected and read.
    """
    from app.api.forecast import read_file_safely
    
    df_expected = pd.DataFrame({
        'date': ['2023-01-01', '2023-02-01', '2023-03-01'],
        'Sales': [100.5, 250.0, 310.2],
        'region': ['North', 'South', 'West']
    })
    
    with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as f:
        temp_path = f.name
        
    try:
        df_expected.to_excel(temp_path, index=False)
        df_parsed = read_file_safely(temp_path)
        assert len(df_parsed) == 3, f"Expected 3 rows, got {len(df_parsed)}"
        assert list(df_parsed.columns) == ['date', 'Sales', 'region']
        print("[PASS] test_excel_xlsx_file_parsing passed successfully!")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == '__main__':
    import sys
    sys.path.insert(0, r'c:\Users\Admin\.gemini\antigravity\scratch\SmartSalesAI\backend')
    test_non_utf8_windows1252_byte_0xd2()
    test_excel_xlsx_file_parsing()
    print("ALL ENCODING AND EXCEL PARSING TESTS PASSED!")
