from playwright.sync_api import sync_playwright
import time
import json
import os

def verify_firehydrant():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        # Navigate to the app (assuming default Vite port)
        page.goto("http://localhost:5173")

        # Wait for app to load (checking for canvas)
        page.wait_for_selector("canvas", timeout=30000)

        # Give it a moment to initialize
        time.sleep(2)

        # Inject the fire hydrant via loadMap
        map_data = {
            "objects": [
                {
                    "type": "fireHydrant",
                    "position": {"x": 10, "y": 0, "z": 10},
                    "rotation": {"x": 0, "y": 0, "z": 0},
                    "scale": {"x": 1, "y": 1, "z": 1},
                    "params": {}
                }
            ],
            "rings": [],
            "history": []
        }

        # Execute loadMap in the browser context
        page.evaluate(f"""
            const data = {json.dumps(map_data)};
            window.app.world.loadMap(data);
        """)

        # Wait for loadMap to finish and DevMode to be accessible
        time.sleep(1)

        # Move camera to see the hydrant
        # We check if devMode camera exists first
        page.evaluate("""
            window.app.devMode.enable();

            // Wait a tiny bit for enable to propagate if needed, but it's usually sync or fast.
            // Check if camera is available
            if (window.app.devMode.camera) {
                const camera = window.app.devMode.camera;
                camera.position.set(12, 2, 12);
                camera.lookAt(10, 0.5, 10);
                camera.updateProjectionMatrix();
            } else {
                console.error("DevMode camera not found");
            }
        """)

        # Wait for render
        time.sleep(2)

        # Take screenshot
        if not os.path.exists("verification"):
            os.makedirs("verification")

        screenshot_path = "verification/fire_hydrant_verification.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    verify_firehydrant()
