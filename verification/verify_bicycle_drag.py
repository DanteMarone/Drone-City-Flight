from playwright.sync_api import sync_playwright
import time

def verify_bicycle_drag(page):
    # Set up console log capture
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

    page.set_viewport_size({"width": 1280, "height": 720})
    page.goto("http://localhost:5173")
    page.wait_for_selector("canvas", timeout=10000)
    page.evaluate("window.app.devMode.enable()")
    page.wait_for_selector(".palette-item[data-type='bicycle']", state="visible")

    # Drag bicycle
    item = page.locator(".palette-item[data-type='bicycle']")

    # We use the mouse simulation which worked for car
    box = item.bounding_box()
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    page.mouse.down()
    page.mouse.move(600, 300, steps=10) # Move to center
    page.mouse.up()

    time.sleep(2)

    count = page.evaluate("""() => {
        return window.app.world.colliders.filter(c => c.mesh.userData.type === 'bicycle').length;
    }""")

    print(f"Bicycle count: {count}")

    if count > 0:
        print("SUCCESS: Bicycle created via Drag Drop.")
    else:
        print("FAILURE: Bicycle not created via Drag Drop.")

    page.screenshot(path="verification/bicycle_drag.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_bicycle_drag(page)
        finally:
            browser.close()
