import os

APPIUM_SERVER_URL = os.environ.get("APPIUM_SERVER_URL", "http://127.0.0.1:4723")
ANDROID_APK_PATH = os.environ.get(
    "ANDROID_APK_PATH",
    os.path.abspath("frontend/android/app/build/outputs/apk/debug/app-debug.apk")
)

DESIRED_CAPABILITIES = {
    "platformName": "Android",
    "automationName": "UiAutomator2",
    "deviceName": os.environ.get("ANDROID_DEVICE_NAME", "Android Emulator"),
    "platformVersion": os.environ.get("ANDROID_VERSION", "11.0"),
    "app": ANDROID_APK_PATH,
    "appPackage": "com.smartsalesai.app",
    "appActivity": "com.smartsalesai.app.MainActivity",
    "noReset": False,
    "fullReset": False,
    "newCommandTimeout": 300,
    "autoGrantPermissions": True,
    "ensureWebviewsHavePages": True,
    "nativeWebScreenshot": True
}
