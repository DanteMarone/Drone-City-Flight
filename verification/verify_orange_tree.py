
import time
from playwright.sync_api import sync_playwright

def verify_orange_tree():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Using a bigger viewport to see more of the UI
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        print("Navigating to app...")
        page.goto("http://localhost:3000")

        # Wait for app to load
        page.wait_for_selector('canvas', timeout=10000)
        time.sleep(2) # Extra time for initialization

        # Enable Dev Mode
        print("Toggling Dev Mode...")
        # Since IJKL are used for movement, and maybe Q/E for camera.
        # But Dev Mode toggle is usually a key or UI button.
        # Checking memory... doesn't specify key.
        # But `src/main.js` usually sets up keys.
        # Let's try executing JS to toggle it directly since `window.app` is exposed.
        page.evaluate("window.app.devMode.enable()")

        time.sleep(1)

        # Drag Orange Tree from palette
        print("Attempting to drag Orange Tree...")

        # Locate the palette item
        # In `src/dev/devUI.js`, the item is <div class="palette-item" ... data-type="orangeTree">
        tree_item = page.locator('.palette-item[data-type="orangeTree"]')

        if tree_item.count() == 0:
            print("Error: Orange Tree palette item not found!")
            browser.close()
            return

        # Perform drag and drop
        # Playwright drag_to might work, or manual mouse events
        # Target: Canvas
        canvas = page.locator('canvas')

        # Move camera to a clear spot if needed?
        # The drag drop logic in `src/dev/interaction.js` usually casts ray from mouse position on drop.

        # Let's try native drag events if standard drag_to fails
        tree_item.drag_to(canvas, target_position={'x': 640, 'y': 360})

        time.sleep(1)

        # Select the new object to confirm it exists and properties are shown
        # Click on center of screen
        page.mouse.click(640, 360)
        time.sleep(0.5)

        # Check if properties panel shows "Type: orangeTree"
        prop_id = page.locator('#prop-id')
        if prop_id.is_visible():
            text = prop_id.inner_text()
            print(f"Selected Object Info: {text}")
        else:
            print("Properties panel not visible (maybe selection failed)")

        # Take screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification/orange_tree_verified.png")

        browser.close()

if __name__ == "__main__":
    verify_orange_tree()
