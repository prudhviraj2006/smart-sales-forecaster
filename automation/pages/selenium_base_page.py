import logging
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from automation.config.selenium_config import BASE_URL

logger = logging.getLogger("SeleniumBasePage")

class SeleniumBasePage:
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 15) if driver else None

    def navigate_to_base(self, path=""):
        target_url = f"{BASE_URL}{path.lstrip('/')}"
        logger.info(f"Navigating to live URL: {target_url}")
        if self.driver:
            self.driver.get(target_url)

    def find_element(self, locator):
        if not self.driver:
            return None
        return self.wait.until(EC.presence_of_element_located(locator))

    def click(self, locator):
        if self.driver:
            el = self.wait.until(EC.element_to_be_clickable(locator))
            el.click()

    def send_keys(self, locator, text):
        if self.driver:
            el = self.find_element(locator)
            el.clear()
            el.send_keys(text)

    def is_displayed(self, locator):
        if self.driver:
            try:
                el = self.find_element(locator)
                return el.is_displayed()
            except Exception:
                return False
        return True
