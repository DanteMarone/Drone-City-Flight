from playwright.sync_api import sync_playwright
import time

def verify_skybox():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app (default vite port is usually 5173)
        page.goto("http://localhost:5173")

        # Wait for the canvas to be present
        page.wait_for_selector("canvas", timeout=10000)

        # Wait a bit for textures to load
        time.sleep(2)

        # Take a screenshot looking forward (default view)
        page.screenshot(path="verification/skybox_forward.png")

        # We need to simulate camera movement to look UP at the sky
        # The app uses standard keyboard inputs or mouse
        # Input config says 'KeyQ' is CAMERA_UP? No, that's tilt.
        # "TILT_MAX: 0.3" in config.
        # But wait, 'KeyQ' is "CAMERA_UP" which might mean "Move Camera Up" or "Tilt Camera Up"?
        # Actually in CameraController:
        # if (input.cameraUp) this.tilt = Math.min(this.tilt + dt * 2, Math.PI / 2);
        # So Q tilts up.

        # Let's hold Q for a second to tilt camera up
        page.keyboard.down("q")
        time.sleep(1)
        page.keyboard.up("q")

        # Wait for frames
        time.sleep(0.5)

        # Take screenshot looking up
        page.screenshot(path="verification/skybox_up.png")

        browser.close()

if __name__ == "__main__":
    verify_skybox()
