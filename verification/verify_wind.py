from playwright.sync_api import sync_playwright

def verify_wind_inputs():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to app
        page.goto("http://localhost:5173/")

        # Enable Dev Mode
        # We need to simulate the key press or execute the JS
        # DevMode toggles with backtick ` or F1 probably?
        # Actually checking inputs... Config usually says Backquote.
        # Let's enable it via JS to be sure.
        page.evaluate("window.app.devMode.enable()")

        # Wait for UI
        page.wait_for_selector("#dev-ui", state="visible")

        # Verify Wind Inputs exist and are type number
        speed_input = page.locator("#dev-wind-speed")
        dir_input = page.locator("#dev-wind-dir")

        # Verify attributes
        assert speed_input.get_attribute("type") == "number"
        assert speed_input.get_attribute("min") == "0"
        assert speed_input.get_attribute("max") == "100"

        assert dir_input.get_attribute("type") == "number"
        assert dir_input.get_attribute("min") == "0"
        assert dir_input.get_attribute("max") == "360"

        # Change values and verify state update
        speed_input.fill("50")
        dir_input.fill("180")

        # Trigger change event just in case fill doesn't (it usually does for 'input' event, but 'change' might need blur)
        speed_input.blur()
        dir_input.blur()

        # Verify in app state
        wind_state = page.evaluate("window.app.world.wind")
        print(f"Wind State: {wind_state}")

        assert wind_state['speed'] == 50
        assert wind_state['direction'] == 180

        # Screenshot
        page.screenshot(path="verification/wind_verification.png")

        browser.close()

if __name__ == "__main__":
    verify_wind_inputs()
