from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage

class AuthPage(BasePage):
    EMAIL_INPUT = (By.XPATH, "//input[@type='email']")
    PASSWORD_INPUT = (By.XPATH, "//input[@type='password']")
    LOGIN_BUTTON = (By.XPATH, "//button[contains(text(), 'Sign In') or contains(text(), 'Login')]")
    GOOGLE_LOGIN_BUTTON = (By.XPATH, "//button[contains(text(), 'Google')]")
    ERROR_ALERT = (By.XPATH, "//div[contains(@class, 'bg-red')]")

    def login(self, email, password):
        self.send_keys(self.EMAIL_INPUT, email)
        self.send_keys(self.PASSWORD_INPUT, password)
        self.click(self.LOGIN_BUTTON)

    def is_error_displayed(self):
        return self.is_displayed(self.ERROR_ALERT)
