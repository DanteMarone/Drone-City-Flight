from playwright.sync_api import sync_playwright
import time

def verify_drag_drop():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Grant permissions for clipboard if needed, or other things.
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        # 1. Navigate to the game
        print("Navigating to game...")
        page.goto("http://localhost:5173")

        # Wait for game to load (canvas)
        page.wait_for_selector("canvas", timeout=60000)

        # 2. Enter Developer Mode
        # Assuming there is a button or key.
        # The DevUI logic binds '`' or similar, but let's check code.
        # DevUI creates a button id="dev-toggle" or similar?
        # Actually DevUI doesn't create a toggle button in _init, it binds to external if exists.
        # But interaction.js or devMode.js toggles on key?
        # devMode.js doesn't show key binding.
        # Let's check main.js or similar to see how to toggle.
        # But we can access `window.app.devMode.toggle()` via console evaluation.

        print("Enabling Dev Mode...")
        page.evaluate("window.app.devMode.toggle()")

        # Wait for Dev UI to appear
        page.wait_for_selector("#dev-ui", state="visible")

        # 3. Create an object (e.g. House) via drag drop from palette,
        # OR select an existing one.
        # Let's select an existing one if any, or create one.
        # The palette items are draggable.
        # Automating HTML5 drag and drop in Playwright is tricky but possible.
        # Alternatively, we can use console to spawn an object.

        print("Spawning a House...")
        page.evaluate("""
            const factory = new window.app.devMode.interaction.factory.constructor(window.app.renderer.scene);
            const obj = factory.createHouse({x: 0, z: 0});
            window.app.world.colliders.push(obj);
            window.app.colliderSystem.addStatic([obj]);
            window.app.devMode.selectObject(obj.mesh);
        """)

        # 4. Verify Selection
        # Properties panel should show X: 0, Z: 0
        x_val = page.locator("#prop-x").input_value()
        z_val = page.locator("#prop-z").input_value()
        print(f"Initial Position: X={x_val}, Z={z_val}")

        if float(x_val) != 0:
            print("Error: Expected X=0")

        # 5. Perform Drag
        # We need to drag the object on the canvas.
        # The object is at (0,0,0).
        # We need to know where (0,0,0) is on screen.
        # We can assume center of screen if camera is looking at it?
        # DevCamera sets pos (0,50,50) looking at (0,0,0).
        # So (0,0,0) is roughly center.

        canvas = page.locator("canvas")
        box = canvas.bounding_box()
        center_x = box['x'] + box['width'] / 2
        center_y = box['y'] + box['height'] / 2

        print(f"Dragging from {center_x}, {center_y}")

        # Mouse Down
        page.mouse.move(center_x, center_y)
        page.mouse.down()

        # Move Mouse
        # Drag to the right
        page.mouse.move(center_x + 100, center_y)

        # Wait a bit
        time.sleep(0.5)

        # check if properties updated while dragging
        x_new = page.locator("#prop-x").input_value()
        print(f"Dragging Position: X={x_new}")

        if float(x_new) == 0:
             print("Warning: Object didn't move. Maybe missed the hit?")

        # Mouse Up
        page.mouse.up()

        # Check final position
        x_final = page.locator("#prop-x").input_value()
        print(f"Final Position: X={x_final}")

        # 6. Take Screenshot
        page.screenshot(path="verification/drag_test.png")

        browser.close()

if __name__ == "__main__":
    verify_drag_drop()
