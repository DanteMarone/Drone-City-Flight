
import time
from playwright.sync_api import sync_playwright

def verify_map(page):
    print("Navigating to app...")
    page.goto("http://localhost:8000")

    # Wait for app to load
    page.wait_for_selector("#game-container canvas")
    print("App loaded.")

    # 1. Verify Blank Map
    colliders_count = page.evaluate("window.app.world.colliders.length")
    print(f"Initial colliders count: {colliders_count}")

    if colliders_count != 0:
        print("FAIL: Initial map is not blank.")
        # Optional: inspect what's there
        objs = page.evaluate("window.app.world.colliders.map(c => c.mesh.userData.type)")
        print(f"Objects present: {objs}")
    else:
        print("PASS: Initial map is blank.")

    # 2. Enable Dev Mode
    print("Enabling Dev Mode...")
    page.evaluate("window.app.devMode.enable()")
    time.sleep(1)

    is_dev_ui_visible = page.is_visible("#dev-ui")
    print(f"Dev UI visible: {is_dev_ui_visible}")

    # 3. Test Drag and Drop
    print("Simulating Drop of a Car...")
    viewport = page.viewport_size
    cx = viewport['width'] / 2
    cy = viewport['height'] / 2

    # Simulate Drop
    page.evaluate(f"""
        const event = new DragEvent('drop', {{
            bubbles: true,
            cancelable: true,
            clientX: {cx},
            clientY: {cy},
            dataTransfer: new DataTransfer()
        }});
        Object.defineProperty(event, 'dataTransfer', {{
            value: {{
                getData: (type) => {{
                    if (type === 'type') return 'car';
                    return '';
                }}
            }}
        }});
        document.body.dispatchEvent(event);
    """)

    time.sleep(1)

    # Check if object was added
    new_colliders_count = page.evaluate("window.app.world.colliders.length")
    print(f"Colliders count after drop: {new_colliders_count}")

    if new_colliders_count == 1:
        print("PASS: Object dropped successfully.")
    else:
        print("FAIL: Object drop failed.")

    # 4. Verify Waypoints are visible
    # After drop, it should be selected.
    # Check if waypointGroup is in scene.
    # We expect `setupDragDrop` to have added it to scene because DevMode is enabled.

    is_waypoint_in_scene = page.evaluate("""
        (() => {
            const car = window.app.world.colliders[0];
            if (!car || !car.mesh) return false;
            const wg = car.mesh.userData.waypointGroup;
            return wg && wg.parent === window.app.renderer.scene;
        })()
    """)
    print(f"Waypoints group in scene after drop: {is_waypoint_in_scene}")

    # If not in scene, let's try to add a waypoint via UI
    if not is_waypoint_in_scene:
        print("Waypoints not auto-shown. Attempting to add waypoint via UI...")
        # Ensure selected
        page.evaluate("window.app.devMode.selectObject(window.app.world.colliders[0].mesh)")
        time.sleep(0.5)

        # Click Add Waypoint
        btn = page.query_selector("#btn-add-waypoint")
        if btn and btn.is_visible():
            btn.click()
            time.sleep(0.5)
            is_waypoint_in_scene = page.evaluate("""
                (() => {
                    const car = window.app.world.colliders[0];
                    if (!car || !car.mesh) return false;
                    const wg = car.mesh.userData.waypointGroup;
                    return wg && wg.parent === window.app.renderer.scene;
                })()
            """)
            print(f"Waypoints group in scene after clicking Add: {is_waypoint_in_scene}")
        else:
            print("Add Waypoint button not visible/found.")

    # 5. Clear Map
    print("Clearing Map...")
    page.evaluate("window.app.devMode.clearMap()")
    time.sleep(1)

    final_colliders_count = page.evaluate("window.app.world.colliders.length")
    physics_count = page.evaluate("window.app.colliderSystem.staticColliders.length")

    # Check scene for ghost waypoints
    # We can check scene.children for any object named 'waypointVisuals_WorldSpace'
    ghost_waypoints = page.evaluate("""
        window.app.renderer.scene.children.filter(c => c.name === 'waypointVisuals_WorldSpace').length
    """)
    print(f"Ghost Waypoint Groups in scene: {ghost_waypoints}")

    if final_colliders_count == 0 and physics_count == 0 and ghost_waypoints == 0:
        print("PASS: Map cleared successfully (Entities, Physics, and Visuals).")
    else:
        print(f"FAIL: Map clear incomplete. Colliders: {final_colliders_count}, Physics: {physics_count}, Ghosts: {ghost_waypoints}")

    page.screenshot(path="verification/test_result_v2.png")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    verify_map(page)
    browser.close()
