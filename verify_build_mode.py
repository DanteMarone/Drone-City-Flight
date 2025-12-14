from playwright.sync_api import sync_playwright
import time

def verify_build_mode():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app
        page.goto("http://localhost:3000")

        # Wait for app to load (checking for canvas)
        page.wait_for_selector("canvas", timeout=10000)

        # Give it a moment to fully initialize
        time.sleep(2)

        # Enable Build Mode (Simulate pressing Backtick)
        page.keyboard.press("Backquote")

        # Wait for Build UI to appear
        page.wait_for_selector("#build-ui", timeout=5000)

        # Verify Header Text
        header = page.locator("#build-ui h2")
        if header.inner_text() != "Build Mode":
            print(f"FAILED: Header text is '{header.inner_text()}', expected 'Build Mode'")
            browser.close()
            return

        # Verify Resume Flight Button Text
        resume_btn = page.get_by_role("button", name="Resume Flight")
        if not resume_btn.is_visible():
            print("FAILED: 'Resume Flight' button not found")
            browser.close()
            return

        # Verify Grid Snap Checkbox is checked
        grid_snap = page.get_by_label("Grid Snap")
        if not grid_snap.is_checked():
            print("FAILED: Grid Snap checkbox is not checked by default")
            browser.close()
            return

        # Take Screenshot
        page.screenshot(path="verification_build_mode.png")
        print("SUCCESS: Build Mode Verified. Screenshot saved to verification_build_mode.png")

        browser.close()

if __name__ == "__main__":
    verify_build_mode()
