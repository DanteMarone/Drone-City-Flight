
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

            # 1. Grid Snap checkbox
            if page.locator("#dev-grid-snap").is_visible():
                print("Grid Snap Checkbox found")
            else:
                print("Grid Snap Checkbox MISSING")

            # Force show property panel via JS for verification since selecting 3D object blindly is hard
            page.evaluate("document.getElementById('prop-panel').style.display = 'flex'")

            # 2. Properties Inputs
            if page.locator("#prop-x").is_visible():
                print("Property Inputs found")
            else:
                print("Property Inputs MISSING")

            # Take screenshot
            page.screenshot(path="verification/dev_mode_ui_final.png")
            print("Screenshot saved to verification/dev_mode_ui_final.png")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/dev_mode_error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_dev_mode()
