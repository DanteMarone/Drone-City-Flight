
import time
from playwright.sync_api import sync_playwright
import os

def verify_cement_mixer():
    # Ensure directory exists
    os.makedirs("verification", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Increase viewport size to see more of the UI
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        try:
            # Navigate to the app
            print("Navigating to app...")
            page.goto("http://localhost:5173")

            # Wait for canvas to load
            print("Waiting for canvas...")
            page.wait_for_selector("canvas", timeout=30000)

            # Wait a bit for the scene to initialize
            time.sleep(3)

            # Enable Dev Mode to access the palette
            print("Enabling Dev Mode...")
            page.evaluate("window.app.devMode.enable()")
            time.sleep(1)

            # Spawn via loadMap - Place it visibly
            print("Spawning Cement Mixer...")
            page.evaluate("""
                const mixer = {
                    type: 'cementMixer',
                    pos: {x: 0, y: 0, z: -15},
                    rot: {x: 0, y: -Math.PI / 4, z: 0}, // Angled view
                    scl: {x: 1, y: 1, z: 1},
                    uuid: 'verify-mixer',
                    params: { waitTime: 0 } // Move immediately? No, let's keep it static for photo
                };

                // We need to ensure it's registered first.
                // Assuming auto-loader worked.

                window.app.world.loadMap({
                    objects: [mixer],
                    rings: [],
                    history: []
                });
            """)

            time.sleep(1)

            # Move camera to get a good look
            print("Moving camera...")
            page.evaluate("""
                if (window.app.devMode && window.app.devMode.camera) {
                    const cam = window.app.devMode.camera;
                    cam.position.set(5, 3, -8); // Up and to the right
                    cam.lookAt(0, 1, -15);
                }
            """)

            time.sleep(2)

            # Verify the drum exists and is rotating?
            # We can check rotation via evaluate, but visual check is screenshot.

            # Take screenshot
            screenshot_path = "verification/cement_mixer.png"
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_cement_mixer()
