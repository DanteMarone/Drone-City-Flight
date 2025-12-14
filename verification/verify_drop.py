
from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Navigate to the app (assuming it's running on port 5173)
        page.goto('http://localhost:5173')

        # Wait for load
        page.wait_for_timeout(2000)

        # Enable Dev Mode
        page.evaluate('window.app.devMode.enable()')
        page.wait_for_timeout(500)

        # Drag a Car onto the map (center of screen, should hit ground)
        # Note: We need to simulate the drag event manually as standard drag-and-drop
        # is hard to trigger on canvas overlays.
        # However, since we fixed the logic in interaction.js drop handler,
        # we can verify that dropping creates an object.

        # We will use the same technique as reproduce_limit.py to simulate drop
        page.evaluate("""
            const dataTransfer = new DataTransfer();
            dataTransfer.setData('type', 'car');
            const event = new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
                clientX: window.innerWidth / 2,
                clientY: window.innerHeight / 2,
                dataTransfer: dataTransfer
            });
            document.body.dispatchEvent(event);
        """)

        page.wait_for_timeout(1000)

        # Take screenshot
        page.screenshot(path='verification/drop_verification.png')

        # Check if object exists in scene
        count = page.evaluate('window.app.world.colliders.length')
        print(f'Colliders count: {count}')

        browser.close()

if __name__ == '__main__':
    run()
