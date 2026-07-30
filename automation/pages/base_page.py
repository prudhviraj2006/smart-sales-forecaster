import logging
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

logger = logging.getLogger("BasePage")

class BasePage:
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 15) if driver else None

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

    def get_text(self, locator):
        if self.driver:
            el = self.find_element(locator)
            return el.text
        return ""

    def is_displayed(self, locator):
        if self.driver:
            try:
                el = self.find_element(locator)
                return el.is_displayed()
            except Exception:
                return False
        return True
