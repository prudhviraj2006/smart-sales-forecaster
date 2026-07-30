import logging
try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
except Exception:
    webdriver = None
    Options = None
from automation.config.selenium_config import CHROME_OPTIONS, BROWSER_TIMEOUT, BASE_URL

logger = logging.getLogger("SeleniumDriverFactory")

class SeleniumDriverFactory:
    _driver = None

    @classmethod
    def get_driver(cls):
        if cls._driver is None:
            if webdriver is None or Options is None:
                logger.warning("Selenium package or Options not available.")
                return None
            try:
                options = Options()
                for opt in CHROME_OPTIONS:
                    options.add_argument(opt)
                
                logger.info(f"Initializing Headless Chrome Driver for target URL: {BASE_URL}")
                cls._driver = webdriver.Chrome(options=options)
                cls._driver.set_page_load_timeout(BROWSER_TIMEOUT)
                cls._driver.implicitly_wait(10)
                logger.info("Selenium WebDriver initialized successfully.")
            except Exception as e:
                logger.warning(f"Primary Chrome initialization failed: {e}. Trying fallback options...")
                try:
                    fallback_options = Options()
                    fallback_options.add_argument("--headless")
                    fallback_options.add_argument("--no-sandbox")
                    fallback_options.add_argument("--disable-dev-shm-usage")
                    cls._driver = webdriver.Chrome(options=fallback_options)
                    cls._driver.set_page_load_timeout(BROWSER_TIMEOUT)
                except Exception as ex:
                    logger.warning(f"Fallback Chrome initialization note: {ex}. Proceeding in simulation mode.")
                    cls._driver = None
        return cls._driver

    @classmethod
    def quit_driver(cls):
        if cls._driver:
            try:
                cls._driver.quit()
                logger.info("Selenium WebDriver session closed.")
            except Exception as e:
                logger.error(f"Error closing WebDriver: {e}")
            finally:
                cls._driver = None
