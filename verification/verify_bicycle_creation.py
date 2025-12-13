from playwright.sync_api import sync_playwright
import time

def verify_dev_mode_bicycle(page):
    # Set up console log capture
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

    page.set_viewport_size({"width": 1280, "height": 720})
    page.goto("http://localhost:5173")
    page.wait_for_selector("canvas", timeout=10000)
    page.evaluate("window.app.devMode.enable()")
    page.wait_for_selector(".palette-item[data-type='bicycle']", state="visible")

    # Manually trigger drop for bicycle
    page.evaluate("""() => {
        const event = new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            clientX: 600,
            clientY: 300,
            view: window
        });

        Object.defineProperty(event, 'dataTransfer', {
            value: {
                getData: (type) => {
                    if (type === 'type') return 'bicycle';
                    return '';
                }
            }
        });

        document.body.dispatchEvent(event);
        // Dispatch on body directly to test my fix?
        // Or dispatch on container and see if it bubbles to body?
        // Let's dispatch on body to be sure we are testing the listener I added.
    }""")

    time.sleep(2)

    count = page.evaluate("""() => {
        return window.app.world.colliders.filter(c => c.mesh.userData.type === 'bicycle').length;
    }""")

    print(f"Bicycle count: {count}")

    if count > 0:
        print("SUCCESS: Bicycle created.")
    else:
        print("FAILURE: Bicycle not created.")

    page.screenshot(path="verification/dev_mode_bicycle.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_dev_mode_bicycle(page)
        finally:
            browser.close()
