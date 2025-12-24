
import os
import sys
from playwright.sync_api import sync_playwright

def verify_dev_ui_layout(page):
    # Navigate to the app
    # Assuming the app is served at localhost:5173 (standard Vite port)
    # The agent should have started the server in background, but I need to do it myself if not.
    # But usually I run verification against dev server.
    page.goto("http://localhost:5173")

    # Wait for the app to load
    page.wait_for_selector("canvas", timeout=30000)

    # Enable Dev Mode
    # Simulating key press `~` or executing JS
    page.keyboard.press("Backquote")

    # Wait for Dev UI container
    page.wait_for_selector("#dev-ui", state="visible")

    # Check for Grid Layout Areas
    # We can check if specific panels exist

    # Top Bar
    page.wait_for_selector(".dev-top-bar")

    # Outliner
    page.wait_for_selector(".dev-outliner")

    # Inspector
    page.wait_for_selector(".dev-inspector")

    # Asset Browser
    page.wait_for_selector(".dev-assets")

    # Screenshot the UI
    page.screenshot(path="verification/dev_ui_layout.png")
    print("Screenshot saved to verification/dev_ui_layout.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        try:
            verify_dev_ui_layout(page)
        except Exception as e:
            print(f"Verification failed: {e}")
            sys.exit(1)
        finally:
            browser.close()
