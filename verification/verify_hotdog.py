
import time
from playwright.sync_api import sync_playwright

def verify_hotdog_stand():
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
            time.sleep(5)

            # Enable Dev Mode to access the palette
            print("Enabling Dev Mode...")
            page.evaluate("window.app.devMode.enable()")
            time.sleep(1)

            # Wait for UI to appear
            page.wait_for_selector("#dev-ui", timeout=10000)

            # Spawn via loadMap
            print("Spawning Hot Dog Stand via map load...")
            page.evaluate("""
                window.app.world.loadMap({
                    objects: [
                        {
                            type: 'hotDogStand',
                            pos: {x: 0, y: 0, z: -10},
                            rot: {x: 0, y: Math.PI, z: 0}, // Face camera
                            scl: {x: 1, y: 1, z: 1},
                            uuid: 'verify-hotdog'
                        }
                    ],
                    rings: [],
                    history: []
                });
            """)

            time.sleep(1)

            # Move camera safely - check if camera exists first
            print("Moving camera...")
            page.evaluate("""
                if (window.app.devMode && window.app.devMode.camera) {
                    const cam = window.app.devMode.camera;
                    cam.position.set(0, 2, -5);
                    cam.lookAt(0, 1, -10);
                } else {
                    console.error("Dev Camera not found");
                }
            """)

            time.sleep(2)

            # Take screenshot
            screenshot_path = "verification/hot_dog_stand.png"
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_hotdog_stand()
