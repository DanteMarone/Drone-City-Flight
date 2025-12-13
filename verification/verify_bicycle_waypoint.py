from playwright.sync_api import sync_playwright

def verify_bicycle_waypoint(page):
    # Go to app
    page.goto("http://localhost:5173")
    page.wait_for_selector("canvas", timeout=10000)

    # Wait for initialization
    page.wait_for_timeout(2000)

    # Enable Dev Mode
    page.evaluate("if (window.app && window.app.devMode) window.app.devMode.enable()")
    page.wait_for_selector("#dev-ui", state="visible", timeout=5000)

    # 1. Place a Bicycle via loadMap
    page.evaluate("""
        const map = {
            objects: [
                { type: 'bicycle', position: { x: 10, y: 0, z: 10 }, params: {} }
            ]
        };
        // Use existing loadMap if available or manually add
        window.app.loadMap(map);
    """)

    # Wait for map load
    page.wait_for_timeout(1000)

    # 2. Select it
    page.evaluate("""
        const bicycle = window.app.world.colliders.find(c => c.mesh.userData.type === 'bicycle').mesh;
        window.app.devMode.selectObject(bicycle);
    """)

    # 3. Check if Properties Panel shows Car Controls (Waypoints)
    # The panel might take a frame to update?
    page.wait_for_selector("#car-controls", state="visible", timeout=2000)

    # 4. Click "Add Waypoint"
    page.click("#btn-add-waypoint")

    # 5. Verify visual feedback (Sphere added to scene)
    waypoint_count = page.evaluate("""
        (() => {
            const bicycle = window.app.devMode.gizmo.selectedObject;
            return bicycle.userData.waypoints.length;
        })()
    """)

    if waypoint_count != 1:
        print(f"Expected 1 waypoint, found {waypoint_count}")
        exit(1)

    print("Waypoint added successfully to Bicycle")

    # Screenshot
    page.screenshot(path="verification/bicycle_waypoint.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_bicycle_waypoint(page)
        except Exception as e:
            print(f"Error: {e}")
            exit(1)
        finally:
            browser.close()
