import os
import sys
import time
import logging

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from automation.drivers.driver_factory import DriverFactory
from automation.tests.test_suite_generator import generate_all_test_cases
from automation.utils.logger import logger
from automation.utils.screenshot import capture_screenshot
from automation.utils.excel_reporter import generate_excel_reports
from automation.utils.html_reporter import generate_html_reports
from automation.utils.json_reporter import generate_json_report
from automation.utils.summary_reporter import generate_markdown_summary

def run_framework():
    logger.info("====================================================")
    logger.info("STARTING ENTERPRISE APPIUM E2E TEST FRAMEWORK")
    logger.info("====================================================")

    start_time = time.time()
    driver = DriverFactory.get_driver()

    # Generate and execute 440 test cases
    test_results = generate_all_test_cases()

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
        "duration": duration
    }

    logger.info(f"Execution Completed in {duration} seconds.")
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

    # Generate Reports in reports/latest/ for GitHub Pages
    generate_excel_reports(test_results, metrics, output_dir="reports/latest")
    generate_html_reports(test_results, metrics, output_dir="reports/latest")
    generate_json_report(test_results, metrics, output_dir="reports/latest")
    generate_markdown_summary(test_results, metrics, output_dir="reports/latest")

    DriverFactory.quit_driver()

    # Determine failure threshold (must be >= 95% pass rate)
    if pass_rate < 95.0:
        logger.error(f"Execution FAILS pipeline criteria: Pass rate {pass_rate}% < 95.0%")
        sys.exit(1)
    else:
        logger.info("Execution PASSED pipeline criteria (Pass rate >= 95.0%).")
        sys.exit(0)

if __name__ == "__main__":
    run_framework()
