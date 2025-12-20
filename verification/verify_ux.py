
from playwright.sync_api import sync_playwright, expect

def verify_ux():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to app
        try:
            page.goto("http://localhost:5173")
        except Exception as e:
            print(f"Error connecting: {e}")
            # Try waiting a bit if server is slow?
            page.wait_for_timeout(2000)
            page.goto("http://localhost:5173")

        # Wait for game to load
        page.wait_for_load_state("networkidle")

        # Enable Dev Mode
        # We can execute JS to enable it directly
        page.evaluate("window.app.devMode.enable()")

        # Wait for Dev UI
        dev_ui = page.locator("#dev-ui")
        expect(dev_ui).to_be_visible()

        # 1. Verify Time Slider ARIA
        slider = page.locator("#dev-time-slider")
        aria_label = slider.get_attribute("aria-label")
        print(f"Time Slider aria-label: {aria_label}")
        if aria_label != "Time of Day":
            print("FAILURE: Time Slider missing aria-label")
        else:
            print("SUCCESS: Time Slider has aria-label")

        # 2. Verify Palette Items are Buttons
        # Wait for palette to populate (might be async if thumbnails load?)
        # Actually buildUI populates it synchronously in _buildPalette
        palette_item = page.locator(".palette-item").first
        tag_name = palette_item.evaluate("el => el.tagName")
        print(f"Palette Item Tag: {tag_name}")
        if tag_name != "BUTTON":
            print("FAILURE: Palette items are not BUTTONs")
        else:
            print("SUCCESS: Palette items are BUTTONs")

        # 3. Verify Property Labels
        # We need to select an object to populate properties or just check the static DOM
        # The Property Panel is built in _createPropertyPanel which runs in constructor.
        # So DOM exists.
        prop_x_label = page.locator("label[for='prop-x']")
        if prop_x_label.count() > 0:
             print("SUCCESS: Property X Label has correct 'for' attribute")
        else:
             print("FAILURE: Property X Label missing 'for' attribute")

        # Take Screenshot
        page.screenshot(path="verification/ux_verification.png")

        browser.close()

if __name__ == "__main__":
    verify_ux()
