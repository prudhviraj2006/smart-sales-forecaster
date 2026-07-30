import os
import logging
from datetime import datetime

logger = logging.getLogger("SummaryReporter")

def generate_markdown_summary(test_results, metrics, output_dir="reports/summary"):
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, "summary.md")

    passed_list = [t for t in test_results if t["status"] == "PASSED"][:5]
    failed_list = [t for t in test_results if t["status"] == "FAILED"][:5]
    skipped_list = [t for t in test_results if t["status"] == "SKIPPED"][:5]

    md = f"""# Android Appium E2E Execution Summary

**Execution Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}  
**Target Device:** Android Emulator (API 30)  
**Package:** `com.smartsalesai.app`  

---

### 📊 Execution Metrics

- **Total Test Cases:** {metrics['total']}
- **Executed:** {metrics['executed']}
- **Passed:** {metrics['passed']} ✅
- **Failed:** {metrics['failed']} ❌
- **Skipped:** {metrics['skipped']} ⚠️
- **Pass Percentage:** `{metrics['pass_rate']}%`
- **Total Duration:** `{metrics['duration']} seconds`

---

### 🟢 PASSED TESTS (Sample)
"""
    for t in passed_list:
        name = t.get("test_name") or t.get("title", "")
        mod = t.get("module") or t.get("category", "")
        md += f"- `✓ {t['test_id']}` - {name} ({mod})\n"

    md += "\n### 🔴 FAILED TESTS (Sample)\n"
    for t in failed_list:
        name = t.get("test_name") or t.get("title", "")
        mod = t.get("module") or t.get("category", "")
        md += f"- `✗ {t['test_id']}` - {name} ({mod}) - *{t.get('failure_reason', 'Assertion Error')}*\n"

    md += "\n### 🟡 SKIPPED TESTS (Sample)\n"
    for t in skipped_list:
        name = t.get("test_name") or t.get("title", "")
        mod = t.get("module") or t.get("category", "")
        md += f"- `- {t['test_id']}` - {name} ({mod})\n"

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(md)

    logger.info(f"Saved markdown summary to {filepath}")
