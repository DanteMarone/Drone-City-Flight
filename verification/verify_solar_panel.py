from playwright.sync_api import sync_playwright
import time

def verify_solar_panel(page):
    print("Navigating to app...")
    page.goto("http://localhost:5173")

    # Wait for the app to initialize (look for canvas)
    print("Waiting for canvas...")
    page.wait_for_selector("canvas", timeout=30000)

    # Wait a bit more for App init
    time.sleep(5)

    print("Injecting Solar Panel via loadMap...")
    # Load a map with just the solar panel
    page.evaluate("""
        const mapData = {
            objects: [
                { type: 'solarPanel', pos: [0, 0, 5], rot: [0, 0, 0], scale: [1, 1, 1] }
            ],
            rings: [],
            history: []
        };
        window.app.world.loadMap(mapData);
    """)

    # Wait for render
    time.sleep(2)

    # Move camera to see it
    print("Adjusting camera...")
    # Drone is at 0,0,0 by default? Or PlayerStart?
    # Let's move drone to look at 0,0,5
    page.evaluate("""
        if (window.app.drone && window.app.drone.mesh) {
            window.app.drone.mesh.position.set(0, 5, -5);
            window.app.drone.mesh.lookAt(0, 0, 5);
        }
    """)

    time.sleep(1)

    print("Taking screenshot...")
    page.screenshot(path="verification/solar_panel.png")
    print("Screenshot saved to verification/solar_panel.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_solar_panel(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
