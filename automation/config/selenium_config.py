import os

# Live GitHub Pages Target URL (Default: https://prudhviraj2006.github.io/smart-sales-forecaster/)
DEFAULT_BASE_URL = "https://prudhviraj2006.github.io/smart-sales-forecaster/"
BASE_URL = os.environ.get("BASE_URL", DEFAULT_BASE_URL)

# Normalize URL with trailing slash
if not BASE_URL.endswith("/"):
    BASE_URL += "/"

HEADLESS = os.environ.get("HEADLESS", "true").lower() == "true"
BROWSER_TIMEOUT = int(os.environ.get("BROWSER_TIMEOUT", "15"))

CHROME_OPTIONS = [
    "--headless=new" if HEADLESS else "",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--window-size=1920,1080",
    "--remote-allow-origins=*",
    "--ignore-certificate-errors"
]
CHROME_OPTIONS = [opt for opt in CHROME_OPTIONS if opt]
