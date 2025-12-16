
from playwright.sync_api import sync_playwright, expect
import time

def verify_hud_accessibility(page):
    # Go to the local preview URL
    page.goto("http://localhost:4173")

    # Wait for the HUD to load (it might take a moment)
    # The battery bar is in .hud-container
    page.wait_for_selector(".hud-container")

    # Locate the battery background element which should now have the progressbar role
    battery_bar = page.locator(".battery-bar-bg")

    # Assertions
    expect(battery_bar).to_have_attribute("role", "progressbar")
    expect(battery_bar).to_have_attribute("aria-labelledby", "batt-label")
    expect(battery_bar).to_have_attribute("aria-valuemin", "0")
    expect(battery_bar).to_have_attribute("aria-valuemax", "100")

    # It starts at 100%
    expect(battery_bar).to_have_attribute("aria-valuenow", "100")
    expect(battery_bar).to_have_attribute("aria-valuetext", "100%")

    # Check that the text value is hidden from screen readers
    battery_text = page.locator("#hud-batt-text")
    expect(battery_text).to_have_attribute("aria-hidden", "true")

    print("Accessibility attributes verified successfully.")

    # Take a screenshot of the HUD area
    hud = page.locator(".hud-container")
    hud.screenshot(path="verification/hud_accessibility.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_hud_accessibility(page)
        except Exception as e:
            print(f"Test failed: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
