from playwright.sync_api import sync_playwright
import time

def verify_skybox():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Listen for console logs
        page.on("console", lambda msg: print(f"Console: {msg.text}"))

        page.goto("http://localhost:5173")
        page.wait_for_selector("canvas", timeout=10000)
        time.sleep(2)

        # Check if the texture loaded successfully
        # We can execute JS to check texture
        result = page.evaluate("""() => {
            if (window.app && window.app.skybox && window.app.skybox.mesh) {
                const tex = window.app.skybox.mesh.material.map;
                return {
                    mesh: true,
                    texture_image: tex && tex.image ? tex.image.src : null,
                    visible: window.app.skybox.mesh.visible
                };
            }
            return { mesh: false };
        }""")
        print(f"Skybox Debug: {result}")

        page.keyboard.down("q")
        time.sleep(1)
        page.keyboard.up("q")
        time.sleep(0.5)

        page.screenshot(path="verification/skybox_up_debug.png")
        browser.close()

if __name__ == "__main__":
    verify_skybox()
