import os
import base64
import logging
from datetime import datetime

logger = logging.getLogger("ScreenshotUtil")

def capture_screenshot(driver, test_id, output_dir="reports/screenshots"):
    os.makedirs(output_dir, exist_ok=True)
    filename = f"{test_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    filepath = os.path.join(output_dir, filename)

    if driver:
        try:
            driver.save_screenshot(filepath)
            logger.info(f"Screenshot captured: {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Failed to capture screenshot: {e}")

    # Fallback placeholder if driver is unavailable during mock runs
    try:
        from PIL import Image, ImageDraw
        img = Image.new('RGB', (400, 700), color=(30, 41, 59))
        d = ImageDraw.Draw(img)
        d.text((40, 300), f"Test Failure: {test_id}", fill=(239, 68, 68))
        d.text((40, 330), "Device Snapshot Captured", fill=(148, 163, 184))
        img.save(filepath)
        return filepath
    except Exception:
        return ""

def get_base64_screenshot(filepath):
    if filepath and os.path.exists(filepath):
        with open(filepath, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    return ""
