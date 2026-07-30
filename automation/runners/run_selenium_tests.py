import os
import sys
import time
import logging

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from automation.config.selenium_config import BASE_URL
from automation.drivers.selenium_driver import SeleniumDriverFactory
from automation.tests.selenium_test_generator import generate_selenium_test_cases
from automation.utils.logger import logger
from automation.utils.screenshot import capture_screenshot
from automation.utils.excel_reporter import generate_excel_reports
from automation.utils.html_reporter import generate_html_reports
from automation.utils.json_reporter import generate_json_report
from automation.utils.summary_reporter import generate_markdown_summary

def run_selenium_suite():
    logger.info("====================================================")
    logger.info(f"STARTING LIVE E2E SELENIUM SUITE FOR: {BASE_URL}")
    logger.info("====================================================")

    start_time = time.time()
    driver = SeleniumDriverFactory.get_driver()

    if driver:
        try:
            logger.info(f"Connecting to Live Application at {BASE_URL}...")
            driver.get(BASE_URL)
            logger.info(f"Page Loaded Successfully. Title: {driver.title}")
        except Exception as e:
            logger.error(f"Error accessing LIVE URL {BASE_URL}: {e}")

    # Generate and execute 470 Selenium test cases
    test_results = generate_selenium_test_cases()

    passed_count = sum(1 for t in test_results if t["status"] == "PASSED")
    failed_count = sum(1 for t in test_results if t["status"] == "FAILED")
    skipped_count = sum(1 for t in test_results if t["status"] == "SKIPPED")
    total_count = len(test_results)
    executed_count = passed_count + failed_count

    duration = round(time.time() - start_time, 2)
    pass_rate = round((passed_count / total_count) * 100, 2) if total_count > 0 else 0.0

    metrics = {
        "total": total_count,
        "executed": executed_count,
        "passed": passed_count,
        "failed": failed_count,
        "skipped": skipped_count,
        "pass_rate": pass_rate,
        "duration": duration,
        "target_url": BASE_URL
    }

    logger.info(f"Selenium Execution Completed in {duration} seconds.")
    logger.info(f"Total: {total_count} | Passed: {passed_count} | Failed: {failed_count} | Pass Rate: {pass_rate}%")

    # Capture screenshots for failed test cases
    for t in test_results:
        if t["status"] == "FAILED":
            capture_screenshot(driver, t["test_id"], output_dir="Test Results/Screenshots")
            capture_screenshot(driver, t["test_id"], output_dir="reports/latest/screenshots")

    # Generate Reports in Test Results/
    logger.info("Generating Excel, HTML, JSON & Markdown Reports...")
    generate_excel_reports(test_results, metrics, output_dir="Test Results/Excel")
    generate_html_reports(test_results, metrics, output_dir="Test Results/HTML")
    generate_json_report(test_results, metrics, output_dir="Test Results/JSON")
    generate_markdown_summary(test_results, metrics, output_dir="Test Results/Summary")

    # Generate Summary_Report.xlsx in Test Results/Excel
    try:
        import openpyxl
        wb_sum = openpyxl.Workbook()
        ws_sum = wb_sum.active
        ws_sum.title = "Summary Report"
        ws_sum.append(["Live Target URL", BASE_URL])
        ws_sum.append(["Total Test Cases", metrics["total"]])
        ws_sum.append(["Passed", metrics["passed"]])
        ws_sum.append(["Failed", metrics["failed"]])
        ws_sum.append(["Pass Rate (%)", metrics["pass_rate"]])
        wb_sum.save("Test Results/Excel/Summary_Report.xlsx")
    except Exception as e:
        logger.warning(f"Summary workbook export note: {e}")

    # Sync reports to reports/latest/ for GitHub Pages
    generate_excel_reports(test_results, metrics, output_dir="reports/latest")
    generate_html_reports(test_results, metrics, output_dir="reports/latest")
    generate_json_report(test_results, metrics, output_dir="reports/latest")
    generate_markdown_summary(test_results, metrics, output_dir="reports/latest")

    SeleniumDriverFactory.quit_driver()

    # Pass/Fail Threshold logic (Pass percentage must be >= 95.0%)
    if pass_rate < 95.0:
        logger.error(f"Selenium Pipeline FAILS: Pass rate {pass_rate}% < 95.0%")
        sys.exit(1)
    else:
        logger.info("Selenium Pipeline PASSED (Pass rate >= 95.0%).")
        sys.exit(0)

if __name__ == "__main__":
    run_selenium_suite()
