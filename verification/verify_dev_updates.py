from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 720})

        # Go to app
        page.goto("http://localhost:5173")
        time.sleep(5) # Wait for load

        # 1. Enable Dev Mode via JS
        page.evaluate("if(window.app && window.app.devMode) window.app.devMode.enable()")
        time.sleep(1)

        # 2. Toggle Grid Snap
        page.click('#dev-grid-snap')
        time.sleep(0.5)

        # 3. Change Grid Size to 50
        page.fill('#dev-grid-size', '50')
        page.evaluate("document.getElementById('dev-grid-size').dispatchEvent(new Event('change'))")
        time.sleep(0.5)

        # 4. Drag and Drop a Road from palette
        src = page.locator(".palette-item[data-type='road']")
        target = page.locator("canvas")

        # Drag to center
        src.drag_to(target, target_position={"x": 640, "y": 360})
        time.sleep(1)

        # 5. Take screenshot
        page.screenshot(path="verification/dev_update_verify.png")

        # 6. Click on UI input (e.g. X position)
        if page.is_visible("#prop-x"):
            page.click("#prop-x")
            time.sleep(0.5)
            # Verify property panel is still visible (click through prevention)
            visible = page.is_visible("#prop-panel")
            print(f"Property Panel Visible: {visible}")
        else:
            print("Property Panel NOT visible (Object not selected?)")

        browser.close()

if __name__ == "__main__":
    run()
