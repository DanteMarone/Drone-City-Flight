from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the built application (served via some server or file protocol if possible,
        # but here we rely on the dev server or just assuming build output exists)
        # Since I cannot start a server in background easily without it blocking or needing cleanup,
        # I will try to use the dist/index.html directly if possible, or assume a server is running.
        # Actually, the instructions say "execute this command... background process".
        # But I haven't started one yet.
        # I will use 'python3 -m http.server 3000 --directory dist' in background.

        page.goto("http://localhost:3000")

        # Wait for app to load (checking for canvas or specific UI)
        page.wait_for_selector("canvas", timeout=10000)

        # Enable Dev Mode
        # The app exposes window.app.devMode.enable()
        page.evaluate("window.app.devMode.enable()")

        # Wait for Dev UI to appear
        page.wait_for_selector("#dev-ui", state="visible")

        # Check for Wind controls
        wind_speed_input = page.locator("#dev-wind-speed")
        wind_dir_input = page.locator("#dev-wind-dir")

        expect(wind_speed_input).to_be_visible()
        expect(wind_dir_input).to_be_visible()

        # Adjust Wind Speed
        wind_speed_input.fill("20")
        # Trigger input event if needed, but fill usually does change.
        # Range inputs might need specialized handling or evaluation.
        page.evaluate("document.querySelector('#dev-wind-speed').value = 20")
        page.evaluate("document.querySelector('#dev-wind-speed').dispatchEvent(new Event('input'))")

        # Take screenshot of the UI showing Wind controls
        page.screenshot(path="verification/wind_ui.png")

        browser.close()

if __name__ == "__main__":
    run()
