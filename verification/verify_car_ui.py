
import time
from playwright.sync_api import sync_playwright

def verify_car_pathing():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to app
        page.goto("http://localhost:5173")

        # Wait for load
        time.sleep(2)

        # Enable Dev Mode (Backquote)
        page.keyboard.press("Backquote")
        time.sleep(1)

        # Drag a Car from palette
        car_item = page.locator(".palette-item[data-type='car']")
        canvas = page.locator("canvas")
        box = canvas.bounding_box()
        target_x = box['x'] + box['width'] / 2
        target_y = box['y'] + box['height'] / 2

        car_item.hover()
        page.mouse.down()
        page.mouse.move(target_x, target_y)
        page.mouse.up()

        time.sleep(1)

        # Add Waypoint
        add_btn = page.locator("#btn-add-waypoint")
        add_btn.click()
        time.sleep(0.5)
        add_btn.click()
        time.sleep(0.5)

        # Verify Waypoint List inputs
        wp_list = page.locator("#waypoint-list")
        if not wp_list.is_visible():
            print("Waypoint list not visible!")
            browser.close()
            return

        inputs = wp_list.locator("input")
        count = inputs.count()
        print(f"Found {count} inputs in waypoint list (Should be 6 for 2 waypoints).")

        if count != 6:
             print("Incorrect number of inputs.")

        # Screenshot
        page.screenshot(path="verification/car_waypoints_ui.png")
        print("Screenshot saved.")

        browser.close()

if __name__ == "__main__":
    verify_car_pathing()
