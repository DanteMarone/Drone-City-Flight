from playwright.sync_api import sync_playwright
import time

def verify_dev_mode_car(page):
    # Set up console log capture
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

    page.set_viewport_size({"width": 1280, "height": 720})
    page.goto("http://localhost:5173")
    page.wait_for_selector("canvas", timeout=10000)
    page.evaluate("window.app.devMode.enable()")
    page.wait_for_selector(".palette-item[data-type='car']", state="visible")

    # Manually trigger drop
    page.evaluate("""() => {
        const event = new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            clientX: 600,
            clientY: 300,
            view: window
        });

        // DataTransfer is read-only in some contexts, but let's try to mock it
        Object.defineProperty(event, 'dataTransfer', {
            value: {
                getData: (type) => {
                    if (type === 'type') return 'car';
                    return '';
                }
            }
        });

        const container = document.getElementById('game-container');
        container.dispatchEvent(event);
    }""")

    time.sleep(2)

    count = page.evaluate("""() => {
        return window.app.world.colliders.filter(c => c.mesh.userData.type === 'car').length;
    }""")

    print(f"Car count: {count}")

    if count > 0:
        print("SUCCESS: Car created.")
    else:
        print("FAILURE: Car not created.")

    page.screenshot(path="verification/dev_mode_car.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_dev_mode_car(page)
        finally:
            browser.close()
