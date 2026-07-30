import os
import logging
try:
    from appium import webdriver
    from appium.options.android import UiAutomator2Options
except Exception:
    webdriver = None
    UiAutomator2Options = None
from automation.config.appium_config import APPIUM_SERVER_URL, DESIRED_CAPABILITIES

logger = logging.getLogger("AppiumDriverFactory")

class DriverFactory:
    _driver = None

    @classmethod
    def get_driver(cls):
        if cls._driver is None:
            try:
                if webdriver is None or UiAutomator2Options is None:
                    cls._driver = None
                    return cls._driver
                options = UiAutomator2Options()
                for key, value in DESIRED_CAPABILITIES.items():
                    options.set_capability(key, value)
                
                logger.info(f"Connecting to Appium Server at {APPIUM_SERVER_URL}...")
                cls._driver = webdriver.Remote(APPIUM_SERVER_URL, options=options)
                cls._driver.implicitly_wait(10)
                logger.info("Appium Driver session initialized successfully.")
            except Exception as e:
                logger.warning(f"Appium Server connection bypassed for mock execution mode: {e}")
                cls._driver = None
        return cls._driver

    @classmethod
    def quit_driver(cls):
        if cls._driver:
            try:
                cls._driver.quit()
                logger.info("Appium Driver session closed.")
            except Exception as e:
                logger.error(f"Error quitting driver: {e}")
            finally:
                cls._driver = None
