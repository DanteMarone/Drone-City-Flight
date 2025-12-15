
from playwright.sync_api import Page, expect, sync_playwright
import time

def test_prop_panel_overflow(page: Page):
    # 1. Load app
    page.goto("http://localhost:5173")

    # Wait for app to be ready
    page.wait_for_selector("canvas", timeout=10000)

    # 2. Enable Dev Mode
    page.evaluate("window.app.devMode.enable()")

    # 3. Create a Car
    page.evaluate("""() => {
        // Mock clipboard data for a car
        window.app.devMode.clipboard = [{
            type: 'car',
            params: { x: 0, y: 10, z: 0 },
            rotation: {x:0, y:0, z:0},
            scale: {x:1, y:1, z:1}
        }];
        window.app.devMode.pasteClipboard();
    }""")

    # 4. Wait for property panel to be open
    page.wait_for_selector("#prop-panel.open", timeout=5000)

    # 5. Add many waypoints to overflow
    # Click 'Add Waypoint' multiple times
    for i in range(15):
        page.click("#btn-add-waypoint")
        # No sleep needed usually, but let's be safe if UI updates are slow

    # 6. Check CSS properties
    panel = page.locator("#prop-panel")

    # Get computed style
    overflow_y = panel.evaluate("el => getComputedStyle(el).overflowY")
    max_height = panel.evaluate("el => getComputedStyle(el).maxHeight")
    height = panel.evaluate("el => getComputedStyle(el).height")

    print(f"Overflow-Y: {overflow_y}")
    print(f"Max-Height: {max_height}")
    print(f"Height: {height}")

    # 7. Take screenshot
    page.screenshot(path="/home/jules/verification/prop_panel_overflow.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_prop_panel_overflow(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            browser.close()
