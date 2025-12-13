
import time
from playwright.sync_api import sync_playwright

def verify_blank_map():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Load the game (Wait for initial load)
        page.goto("http://localhost:5173")
        page.wait_for_timeout(3000) # Wait for Three.js to init

        # 2. Screenshot Startup State
        print("Taking startup screenshot...")
        page.screenshot(path="verification/startup_blank.png")

        # 3. Enable DevMode (Simulate '`' key)
        page.keyboard.press("Backquote")
        page.wait_for_timeout(500)

        # 4. Create a dummy object (House) via loadMap
        print("Adding test object via app.loadMap...")
        page.evaluate("""
            const app = window.app;
            app.loadMap({
                objects: [{
                    type: 'house',
                    position: {x: 0, y: 0, z: -20},
                    params: { width: 10, height: 10, depth: 10 }
                }]
            });
        """)

        page.wait_for_timeout(1000)
        page.screenshot(path="verification/with_object.png")

        # 5. Click "Clear Map"
        # Find button with text "Clear Map"
        print("Clicking Clear Map...")
        # Ensure we are in DevMode UI context. The button is likely in the property panel or a sidebar.
        # Based on DevUI, it might be in a generic tools section.
        # Let's search by text.
        page.get_by_role("button", name="Clear Map").click()

        page.wait_for_timeout(1000)

        # 6. Screenshot Result
        print("Taking cleared screenshot...")
        page.screenshot(path="verification/cleared_map.png")

        browser.close()

if __name__ == "__main__":
    verify_blank_map()
