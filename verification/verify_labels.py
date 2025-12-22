
from playwright.sync_api import sync_playwright

def verify_labels():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # We need to set the viewport size to ensure the UI is visible
        page = browser.new_page(viewport={'width': 1280, 'height': 720})

        try:
            page.goto("http://localhost:5173")
            page.wait_for_selector("#game-container", state="visible", timeout=10000)

            # Enable Dev Mode
            page.evaluate("window.app.devMode.enable()")
            page.wait_for_selector("#dev-ui", state="visible")

            # 1. Check Property Inputs
            # Use exact text match or cleaner selector
            label_x = page.locator("label.dev-prop-label").filter(has_text="X").first
            # Note: "RX" contains "X", so filtering by text "X" might match RX too if not strict.
            # But here I'm using .first which isn't ideal but let's try exact text.

            label_x = page.locator("label.dev-prop-label:text-is('X')")

            if label_x.count() > 0:
                for_attr = label_x.get_attribute("for")
                print(f"Label X 'for' attribute: {for_attr}")
                if for_attr == "prop-x":
                    print("PASS: Label X is associated with prop-x")
                else:
                    print(f"FAIL: Label X is associated with {for_attr}")
            else:
                 print("FAIL: Label X not found")

            # 2. Check Time Slider Label
            label_time = page.locator("label[for='dev-time-slider']")
            if label_time.count() > 0:
                 print("PASS: Time Slider label found with correct 'for' attribute")
            else:
                 print("FAIL: Time Slider label not found or missing 'for' attribute")

            # 3. Check Aspect Ratio Label
            label_aspect = page.locator("label[for='prop-scale-lock']")
            if label_aspect.count() > 0:
                 print("PASS: Aspect Ratio label found with correct 'for' attribute")
            else:
                 print("FAIL: Aspect Ratio label not found or missing 'for' attribute")

            # Take a screenshot of the Dev UI
            page.screenshot(path="verification/dev_ui_labels.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_labels()
