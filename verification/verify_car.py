
from playwright.sync_api import sync_playwright
import time

def verify_car_pathing(page):
    page.goto("http://localhost:5173")

    page.wait_for_selector("canvas", timeout=10000)
    time.sleep(2)

    # Toggle Developer Mode
    page.keyboard.press("Backquote")
    time.sleep(1)

    # Create Car via interaction factory which is already instantiated
    page.evaluate("""
        const factory = window.app.devMode.interaction.factory;
        const res = factory.createCar({x: 0, z: -20});
        // Correctly push to colliders as World uses
        window.app.world.colliders.push(res);
        window.app.devMode.selectObject(res.mesh);
        window.car = res.mesh;
    """)
    print("Created Car via console.")
    time.sleep(1)

    # Add Waypoints
    add_wp_btn = page.get_by_text("Add Waypoint")
    if add_wp_btn.is_visible():
        add_wp_btn.click()
        time.sleep(0.5)
        add_wp_btn.click()
        time.sleep(0.5)
    else:
        print("Add Waypoint button not found!")

    # Verify Visuals in Dev Mode
    page.screenshot(path="verification/dev_mode_waypoints.png")
    print("Captured Dev Mode screenshot.")

    # Toggle Dev Mode OFF
    page.keyboard.press("Backquote")
    time.sleep(1)

    # Verify Visuals Gone in Normal Mode
    page.screenshot(path="verification/normal_mode_waypoints.png")
    print("Captured Normal Mode screenshot.")

    # Wait and capture movement
    time.sleep(2)
    page.screenshot(path="verification/car_movement.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_car_pathing(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
