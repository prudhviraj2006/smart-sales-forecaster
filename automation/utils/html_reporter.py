import os
import json
import logging
from datetime import datetime

logger = logging.getLogger("HTMLReporter")

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Android Appium E2E Automation Report</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .badge-passed { background-color: #10B981; color: white; }
        .badge-failed { background-color: #EF4444; color: white; }
        .badge-skipped { background-color: #F59E0B; color: white; }
    </style>
</head>
<body class="bg-gray-900 text-gray-100 font-sans leading-normal tracking-normal p-6">
    <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mb-6">
            <div>
                <h1 class="text-3xl font-extrabold text-blue-400">Android Appium E2E Execution Report</h1>
                <p class="text-gray-400 text-sm mt-1">Smart Sales AI • Target: Android Emulator • Date: {{ execution_date }}</p>
            </div>
            <div class="mt-4 md:mt-0 text-right">
                <span class="inline-block px-4 py-2 rounded-full text-lg font-bold bg-blue-600 text-white">
                    Pass Rate: {{ metrics.pass_rate }}%
                </span>
            </div>
        </div>

        <!-- Metric Cards -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
                <p class="text-gray-400 text-xs font-semibold uppercase">Total Cases</p>
                <p class="text-3xl font-black text-white mt-1">{{ metrics.total }}</p>
            </div>
            <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
                <p class="text-gray-400 text-xs font-semibold uppercase">Executed</p>
                <p class="text-3xl font-black text-blue-400 mt-1">{{ metrics.executed }}</p>
            </div>
            <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
                <p class="text-gray-400 text-xs font-semibold uppercase">Passed</p>
                <p class="text-3xl font-black text-green-400 mt-1">{{ metrics.passed }}</p>
            </div>
            <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center">
                <p class="text-gray-400 text-xs font-semibold uppercase">Failed</p>
                <p class="text-3xl font-black text-red-400 mt-1">{{ metrics.failed }}</p>
            </div>
            <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center col-span-2 md:col-span-1">
                <p class="text-gray-400 text-xs font-semibold uppercase">Skipped</p>
                <p class="text-3xl font-black text-yellow-400 mt-1">{{ metrics.skipped }}</p>
            </div>
        </div>

        <!-- Charts & Summary -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center">
                <h3 class="text-lg font-bold text-gray-200 mb-4">Execution Breakdown</h3>
                <div class="w-48 h-48">
                    <canvas id="statusChart"></canvas>
                </div>
            </div>
            <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 md:col-span-2">
                <h3 class="text-lg font-bold text-gray-200 mb-4">System Environment & Metrics</h3>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="bg-gray-900 p-3 rounded border border-gray-700">
                        <span class="text-gray-400">Application:</span> <strong class="text-white">SmartSalesAI Android</strong>
                    </div>
                    <div class="bg-gray-900 p-3 rounded border border-gray-700">
                        <span class="text-gray-400">Package:</span> <strong class="text-white">com.smartsalesai.app</strong>
                    </div>
                    <div class="bg-gray-900 p-3 rounded border border-gray-700">
                        <span class="text-gray-400">Test Driver:</span> <strong class="text-white">Appium UiAutomator2</strong>
                    </div>
                    <div class="bg-gray-900 p-3 rounded border border-gray-700">
                        <span class="text-gray-400">Platform:</span> <strong class="text-white">Android 11.0 (API 30)</strong>
                    </div>
                    <div class="bg-gray-900 p-3 rounded border border-gray-700">
                        <span class="text-gray-400">Duration:</span> <strong class="text-white">{{ metrics.duration }} seconds</strong>
                    </div>
                    <div class="bg-gray-900 p-3 rounded border border-gray-700">
                        <span class="text-gray-400">CI/CD Engine:</span> <strong class="text-white">GitHub Actions</strong>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filter Search Bar -->
        <div class="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <h2 class="text-2xl font-bold text-white">Test Cases ({{ test_results|length }})</h2>
            <input type="text" id="searchInput" onkeyup="filterTable()" placeholder="Search test name, ID or module..." 
                   class="bg-gray-800 text-gray-100 px-4 py-2 rounded-lg border border-gray-700 w-full md:w-80 focus:outline-none focus:border-blue-500">
        </div>

        <!-- Test Results Table -->
        <div class="bg-gray-800 rounded-xl border border-gray-700 overflow-x-auto shadow-xl">
            <table class="w-full text-left text-sm text-gray-300" id="testTable">
                <thead class="bg-gray-900 text-gray-400 uppercase text-xs">
                    <tr>
                        <th class="px-4 py-3">Test ID</th>
                        <th class="px-4 py-3">Module</th>
                        <th class="px-4 py-3">Test Name</th>
                        <th class="px-4 py-3">Priority</th>
                        <th class="px-4 py-3">Status</th>
                        <th class="px-4 py-3">Duration</th>
                        <th class="px-4 py-3">Details</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
                    {% for tc in test_results %}
                    <tr class="hover:bg-gray-750 transition">
                        <td class="px-4 py-3 font-mono font-bold text-blue-400">{{ tc.test_id }}</td>
                        <td class="px-4 py-3"><span class="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">{{ tc.module }}</span></td>
                        <td class="px-4 py-3 font-medium text-white">{{ tc.test_name }}</td>
                        <td class="px-4 py-3 font-bold text-xs">
                            <span class="px-2 py-0.5 rounded {% if tc.priority == 'P0' %}bg-red-900 text-red-200{% elif tc.priority == 'P1' %}bg-yellow-900 text-yellow-200{% else %}bg-gray-700 text-gray-300{% endif %}">
                                {{ tc.priority }}
                            </span>
                        </td>
                        <td class="px-4 py-3">
                            <span class="px-2 py-1 rounded-full text-xs font-bold {% if tc.status == 'PASSED' %}badge-passed{% elif tc.status == 'FAILED' %}badge-failed{% else %}badge-skipped{% endif %}">
                                {{ tc.status }}
                            </span>
                        </td>
                        <td class="px-4 py-3 font-mono">{{ tc.duration }}s</td>
                        <td class="px-4 py-3 text-xs text-gray-400">{{ tc.failure_reason if tc.failure_reason else 'Validated successfully' }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>
    </div>

    <script>
        const ctx = document.getElementById('statusChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed', 'Skipped'],
                datasets: [{
                    data: [{{ metrics.passed }}, {{ metrics.failed }}, {{ metrics.skipped }}],
                    backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });

        function filterTable() {
            let input = document.getElementById('searchInput').value.toLowerCase();
            let rows = document.querySelectorAll('#testTable tbody tr');
            rows.forEach(row => {
                let text = row.innerText.toLowerCase();
                row.style.display = text.includes(input) ? '' : 'none';
            });
        }
    </script>
</body>
</html>
"""

def generate_html_reports(test_results, metrics, output_dir="reports/html"):
    os.makedirs(output_dir, exist_ok=True)
    report_file = os.path.join(output_dir, "execution-report.html")
    dashboard_file = os.path.join(output_dir, "dashboard.html")
    trends_file = os.path.join(output_dir, "trends.html")

    # Normalize test_results keys for template rendering
    for tc in test_results:
        tc["module"] = tc.get("module") or tc.get("category", "")
        tc["test_name"] = tc.get("test_name") or tc.get("title", "")

    try:
        from jinja2 import Template
        template = Template(HTML_TEMPLATE)
        rendered_html = template.render(
            test_results=test_results,
            metrics=metrics,
            execution_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
        )
    except Exception as e:
        logger.warning(f"Jinja2 rendering fallback: {e}")
        rendered_html = f"<html><body><h1>Android Execution Report</h1><p>Passed: {metrics['passed']} / Total: {metrics['total']}</p></body></html>"

    with open(report_file, "w", encoding="utf-8") as f:
        f.write(rendered_html)

    with open(dashboard_file, "w", encoding="utf-8") as f:
        f.write(rendered_html)

    with open(trends_file, "w", encoding="utf-8") as f:
        f.write(rendered_html)

    logger.info(f"Saved HTML execution report to {report_file}")
