import os
import json
import logging
from datetime import datetime

logger = logging.getLogger("JSONReporter")

def generate_json_report(test_results, metrics, output_dir="reports/json"):
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, "execution-results.json")

    data = {
        "timestamp": datetime.now().isoformat(),
        "application": "SmartSalesAI Android App",
        "platform": "Android 11.0 / UiAutomator2",
        "metrics": metrics,
        "test_results": test_results
    }

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    logger.info(f"Saved JSON report to {filepath}")
