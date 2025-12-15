from playwright.sync_api import Page, expect, sync_playwright
import time

def test_bus_verification(page: Page):
    # 1. Arrange: Go to the app.
    page.goto("http://localhost:4173")

    # Wait for the canvas to be present (game loaded)
    page.wait_for_selector("canvas", timeout=30000)

    # Wait a bit for initialization
    time.sleep(2)

    # 2. Act: Enable Dev Mode via console
    page.evaluate("window.app.devMode.enable()")

    # Open Palette (click the button if visible or just use the fact that it's open in dev mode usually)
    # The palette is inside #dev-ui.

    # Wait for palette
    page.wait_for_selector("#dev-ui", timeout=5000)

    # Check for "City Bus" text
    city_bus = page.get_by_text("City Bus")
    expect(city_bus).to_be_visible()

    # Check for "School Bus" text
    school_bus = page.get_by_text("School Bus")
    expect(school_bus).to_be_visible()

    # Click School Bus to select it
    school_bus.click()

    # Simulate a click on the canvas to place it
    # We need to click on the canvas.
    canvas = page.locator("canvas")
    box = canvas.bounding_box()
    if box:
        page.mouse.click(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)

    time.sleep(1)

    # 4. Screenshot
    page.screenshot(path="verification/bus_verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_bus_verification(page)
            print("Verification successful!")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/bus_verification_error.png")
        finally:
            browser.close()
