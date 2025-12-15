
import time
from playwright.sync_api import sync_playwright

def verify_street_light():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the preview server (default Vite preview port is 4173)
        page.goto("http://localhost:4173")

        # Wait for canvas to load
        page.wait_for_selector("canvas", timeout=10000)

        # Enable Dev Mode
        page.evaluate("window.app.devMode.enable()")

        # Wait for UI to appear
        page.wait_for_selector("#dev-ui", timeout=5000)

        # Find the button with text "Street Light" in the palette
        palette_item = page.get_by_text("Street Light")
        if palette_item.count() == 0:
            print("Street Light NOT found in palette!")
            page.screenshot(path="verification/failed_palette.png")
            raise Exception("Street Light missing from palette")

        print("Found Street Light in palette!")

        # Drop it
        page.evaluate("""
            const dropEvent = new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
                clientX: window.innerWidth / 2,
                clientY: window.innerHeight / 2,
                dataTransfer: new DataTransfer()
            });
            dropEvent.dataTransfer.setData('type', 'streetLight');
            document.body.dispatchEvent(dropEvent);
        """)

        # Wait a bit
        time.sleep(2)

        # Adjust camera using DevMode camera controller
        # In DevMode, `window.app.devMode.cameraController.camera` is the active camera.
        page.evaluate("""
            const cam = window.app.devMode.cameraController.camera;
            cam.position.set(0, 15, 15);
            cam.lookAt(0, 5, 0);
        """)

        time.sleep(1)

        # Take screenshot
        screenshot_path = "verification/street_light_verified.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    verify_street_light()
