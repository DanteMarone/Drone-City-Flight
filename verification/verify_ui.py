
from playwright.sync_api import sync_playwright
import time

def verify_dev_mode():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Give server time to start
        time.sleep(2)

        page = browser.new_page()
        try:
            # Navigate to the app (Vite default port 5173)
            page.goto("http://localhost:5173")

            # Wait for loaded
            page.wait_for_selector("#ui-layer", timeout=5000)

            # Pause game to open menu (Esc key)
            page.keyboard.press("Escape")

            # Wait for Menu
            page.wait_for_selector("#pause-menu", state="visible", timeout=3000)

            # Click Developer Mode button
            page.click("#btn-dev")

            # Wait for Dev UI
            page.wait_for_selector("#dev-ui", state="visible", timeout=3000)

            # Check for new elements
            # 1. Grid Snap checkbox
            if page.locator("#dev-grid-snap").is_visible():
                print("Grid Snap Checkbox found")
            else:
                print("Grid Snap Checkbox MISSING")

            # 2. Palette items
            if page.locator(".palette-item[data-type='river']").is_visible():
                print("River Palette Item found")
            else:
                print("River Palette Item MISSING")

            if page.locator(".palette-item[data-type='car']").is_visible():
                print("Car Palette Item found")
            else:
                print("Car Palette Item MISSING")

            # Take screenshot
            page.screenshot(path="verification/dev_mode_ui.png")
            print("Screenshot saved to verification/dev_mode_ui.png")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/dev_mode_error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_dev_mode()
