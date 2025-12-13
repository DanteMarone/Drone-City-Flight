
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
        # Simulate Drag and Drop
        # 1. Find 'Car' palette item
        car_item = page.locator(".palette-item[data-type='car']")

        # 2. Drag to canvas center
        canvas = page.locator("canvas")
        box = canvas.bounding_box()
        target_x = box['x'] + box['width'] / 2
        target_y = box['y'] + box['height'] / 2

        car_item.hover()
        page.mouse.down()
        page.mouse.move(target_x, target_y)
        page.mouse.up()

        time.sleep(1)

        # Car should be selected. Check if properties panel is visible and car-controls are there.
        controls = page.locator("#car-controls")
        if not controls.is_visible():
            print("Car controls not visible!")
            browser.close()
            return

        print("Car controls visible.")

        # Add Waypoint
        add_btn = page.locator("#btn-add-waypoint")
        add_btn.click()
        time.sleep(0.5)
        add_btn.click()
        time.sleep(0.5)

        # Screenshot
        page.screenshot(path="verification/car_waypoints.png")
        print("Screenshot saved.")

        browser.close()

if __name__ == "__main__":
    verify_car_pathing()
