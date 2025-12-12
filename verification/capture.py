
from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to local server (Vite default port 5173)
        try:
            page.goto("http://localhost:5173", timeout=60000)

            # Wait for canvas to be present
            page.wait_for_selector("canvas")

            # Wait for assets to load / generation to happen
            time.sleep(5)

            # Take screenshot
            page.screenshot(path="verification/screenshot.png")
            print("Screenshot taken.")

        except Exception as e:
            print(f"Error: {e}")

        finally:
            browser.close()

if __name__ == "__main__":
    run()
