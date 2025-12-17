
from playwright.sync_api import sync_playwright, expect
import time

def verify_dev_ui(page):
    # Wait for app to load
    page.goto("http://localhost:5173")
    page.wait_for_load_state("networkidle")

    # Enable Dev Mode
    page.evaluate("window.app.devMode.enable()")

    # Wait for Dev UI
    dev_ui = page.locator("#dev-ui")
    expect(dev_ui).to_be_visible()

    # Verify "Load Map" button accessibility
    # The label should have tabindex="0" and role="button"
    load_label = dev_ui.locator(".file-btn", has_text="Load Map")
    expect(load_label).to_have_attribute("tabindex", "0")
    expect(load_label).to_have_attribute("role", "button")
    expect(load_label).to_have_attribute("aria-label", "Load Custom Map")

    # Verify input is visually hidden but present
    file_input = dev_ui.locator("#dev-load")
    expect(file_input).to_have_class("visually-hidden")

    # Verify Wind Inputs labels
    wind_speed_label = dev_ui.locator("label[for='dev-wind-speed']")
    expect(wind_speed_label).to_be_visible()

    wind_dir_label = dev_ui.locator("label[for='dev-wind-dir']")
    expect(wind_dir_label).to_be_visible()

    # Focus the Load Map button to check focus styles (requires running CSS)
    # We can't easily assert pixel values of outline in headless, but we can capture a screenshot
    load_label.focus()

    # Take screenshot of the whole UI
    page.screenshot(path="verification/dev_ui_accessibility.png")

    print("Verification complete!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_dev_ui(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
