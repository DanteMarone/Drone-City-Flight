import time
from playwright.sync_api import sync_playwright

def verify_road_snap():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        try:
            print("Navigating to app...")
            page.goto("http://localhost:5173")
            page.wait_for_timeout(5000)

            # Enable Dev Mode
            print("Enabling Dev Mode...")
            page.evaluate("window.app.devMode.enable()")
            page.wait_for_timeout(2000)

            # Select Road Tool
            print("Selecting Road Tool...")
            page.click("text=Road Tool")
            page.wait_for_timeout(1000)

            # Perform drag operation
            # Click at center and drag slightly diagonal to produce a fractional length if not snapped
            start_x, start_y = 960, 540

            # Drag to right by 100 pixels (approx 5-6 units) and slightly down (to test axis lock/snap)
            # 100px in screen space depends on camera.
            # Let's drag a significant amount.
            end_x = start_x + 150
            end_y = start_y + 10 # Slight offset

            print(f"Dragging from ({start_x}, {start_y}) to ({end_x}, {end_y})")

            page.mouse.move(start_x, start_y)
            page.mouse.down()
            page.mouse.move(end_x, end_y, steps=10)
            page.wait_for_timeout(500)

            # Verify the scale/length BEFORE releasing (Ghost mesh)
            # Access ghost mesh via interaction manager
            scale_z = page.evaluate("""() => {
                const ghost = window.app.devMode.interaction.ghostMesh;
                return ghost ? ghost.scale.z : 0;
            }""")

            print(f"Ghost Scale Z: {scale_z}")

            # Check if integer
            if abs(scale_z - round(scale_z)) < 0.001:
                print("SUCCESS: Scale Z is an integer.")
            else:
                print(f"FAILURE: Scale Z {scale_z} is NOT an integer.")

            page.mouse.up()
            page.wait_for_timeout(1000)

            # Verify the created object
            print("Verifying created object...")
            # Select the last created object (should be selected by default)

            # Get properties of selected object
            props = page.evaluate("""() => {
                const sel = window.app.devMode.selectedObjects[0];
                if (!sel) return null;
                return {
                    scaleZ: sel.scale.z,
                    position: sel.position,
                    rotation: sel.rotation
                };
            }""")

            print(f"Created Object Props: {props}")

            if props and abs(props['scaleZ'] - round(props['scaleZ'])) < 0.001:
                 print("SUCCESS: Final Object Scale Z is integer.")
            else:
                 print("FAILURE: Final Object Scale Z is NOT integer.")

            page.screenshot(path="verification_road_snap_strict.png")
            print("Screenshot saved to verification_road_snap_strict.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="error_road_snap.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_road_snap()
