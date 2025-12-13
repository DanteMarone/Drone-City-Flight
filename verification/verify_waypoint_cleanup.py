
import time
from playwright.sync_api import sync_playwright

def verify_waypoint_cleanup():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Load the game
        page.goto("http://localhost:5173")
        page.wait_for_timeout(3000)

        # 2. Enable DevMode
        page.keyboard.press("Backquote")
        page.wait_for_timeout(500)

        # 3. Add a Car via loadMap logic (ensuring it's properly registered)
        print("Adding Car with Waypoints...")
        page.evaluate("""
            const app = window.app;
            app.loadMap({
                objects: [{
                    type: 'car',
                    position: {x: 0, y: 0, z: -20},
                    params: {}
                }]
            });
        """)
        page.wait_for_timeout(1000)

        # 4. Add Waypoints to the car manually via DevMode logic
        print("Adding Waypoints...")
        page.evaluate("""
            const app = window.app;
            // Find the car we just added
            const car = app.world.colliders.find(c => c.mesh.userData.type === 'car').mesh;

            // Select it
            app.devMode.selectObject(car);

            // Add waypoints
            app.devMode.addWaypointToSelected();
            app.devMode.addWaypointToSelected();
        """)
        page.wait_for_timeout(500)
        page.screenshot(path="verification/car_with_waypoints.png")

        # 5. Clear Map
        print("Clicking Clear Map...")
        page.get_by_role("button", name="Clear Map").click()
        page.wait_for_timeout(1000)

        # 6. Screenshot Result
        print("Taking cleared screenshot...")
        page.screenshot(path="verification/cleared_waypoints.png")

        browser.close()

if __name__ == "__main__":
    verify_waypoint_cleanup()
