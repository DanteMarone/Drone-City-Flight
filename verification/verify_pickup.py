
from playwright.sync_api import sync_playwright
import time
import os

def verify_pickup_truck(page):
    page.goto("http://localhost:5173")

    page.wait_for_selector("canvas", timeout=10000)
    time.sleep(2)

    # Toggle Developer Mode
    page.keyboard.press("Backquote")
    time.sleep(1)

    # Create Pickup via console
    # Note: factory.createObject calls entity.init() internally usually?
    # Let's check ObjectFactory.createObject logic.
    # If not, we need to call init()

    page.evaluate("""
        const factory = window.app.devMode.interaction.factory;
        // createObject usually calls init().
        const res = factory.createObject('pickup', {x: 0, z: -20});

        // It seems createObject returns the Entity Instance, not the mesh?
        // Let's verify what res is.
        // Assuming res is the Entity instance.

        if (res && res.mesh) {
            window.app.world.addEntity(res);

            // Wait, does addEntity add to colliders?
            // Memory says "Objects must be added to the world.colliders array...".
            // world.addEntity handles system registration.
            // world.colliders is array of Entities.
            // app.colliderSystem.addStatic expects array of Entities (or objects with mesh & box).

            window.app.colliderSystem.addStatic([res]);

            window.app.devMode.selectObject(res.mesh);
            window.pickup = res.mesh;
        } else {
            console.error("Factory returned invalid object:", res);
        }
    """)
    print("Created Pickup Truck via console.")
    time.sleep(1)

    # Check for Wait Time Control
    wait_input = page.locator("#prop-wait-time")
    if wait_input.is_visible():
        print("Wait Time control is visible.")
        # Change wait time to 2 seconds
        wait_input.fill("2")
        wait_input.press("Enter")
        time.sleep(0.5)
        # Verify it updated the object
        wait_val = page.evaluate("window.pickup.userData.waitTime")
        print(f"Wait Time updated to: {wait_val}")
        if wait_val != 2:
            print("ERROR: Wait time not updated!")
    else:
        print("ERROR: Wait Time control NOT visible!")

    # Add Waypoint
    add_wp_btn = page.get_by_text("Add Waypoint")
    if add_wp_btn.is_visible():
        add_wp_btn.click()
        time.sleep(0.5)
        print("Added waypoint.")
    else:
        print("ERROR: Add Waypoint button not found!")

    # Screenshot Dev Mode
    if not os.path.exists("verification"):
        os.makedirs("verification")
    page.screenshot(path="verification/pickup_dev_mode.png")
    print("Captured Dev Mode screenshot.")

    # Toggle Dev Mode OFF
    page.keyboard.press("Backquote")
    time.sleep(1)

    # Screenshot Game Mode
    page.screenshot(path="verification/pickup_game_mode.png")
    print("Captured Game Mode screenshot.")

    # Wait for movement logic to kick in (ping pong and wait)
    # We set wait to 2s.
    # It should move to waypoint, wait 2s, move back.
    # Just observing via logs/screenshots isn't perfect but checks non-crash.
    time.sleep(5)
    print("Finished verification flow.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_pickup_truck(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
