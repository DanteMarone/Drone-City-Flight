from playwright.sync_api import sync_playwright
import time

def verify_dev_mode_drag_drop_robust(page):
    # Set up console log capture
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

    page.set_viewport_size({"width": 1280, "height": 720})
    page.goto("http://localhost:5173")
    page.wait_for_selector("canvas", timeout=10000)
    page.evaluate("window.app.devMode.enable()")
    page.wait_for_selector(".palette-item[data-type='car']", state="visible")

    # Use drag_to which simulates real events.
    # If this works, it means our occlusion/listener fix is good.
    car_item = page.locator(".palette-item[data-type='car']")
    target = page.locator("canvas") # Target the canvas directly now, or document body

    # We drag to the center of the viewport
    # We can use mouse API to be explicit
    box = car_item.bounding_box()
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    page.mouse.down()
    page.mouse.move(600, 300, steps=10) # Move to center
    page.mouse.up()

    time.sleep(2)

    count = page.evaluate("""() => {
        return window.app.world.colliders.filter(c => c.mesh.userData.type === 'car').length;
    }""")

    print(f"Car count: {count}")

    if count > 0:
        print("SUCCESS: Car created via Drag Drop.")
    else:
        print("FAILURE: Car not created via Drag Drop.")

    page.screenshot(path="verification/dev_mode_drag_drop_robust.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_dev_mode_drag_drop_robust(page)
        finally:
            browser.close()
