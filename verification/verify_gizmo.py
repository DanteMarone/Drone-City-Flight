import time
from playwright.sync_api import sync_playwright

def test_gizmo_handles(page):
    page.goto('http://localhost:5173')

    # Wait for DevMode to be ready
    page.wait_for_timeout(3000)

    # Enable Dev Mode (Key: `)
    page.keyboard.press('Backquote')
    page.wait_for_timeout(1000)

    # Click on the center of the screen to select the house (assuming camera setup)
    # The house is usually at specific coordinates.
    # But let's just click near center-ish where we saw the house in screenshot.
    # In previous run screenshot, house was center-ish.

    width = page.viewport_size['width']
    height = page.viewport_size['height']
    page.mouse.click(width / 2, height / 2 + 100) # Slightly lower

    page.wait_for_timeout(1000)

    # Take screenshot
    page.screenshot(path='verification/gizmo_verification.png')

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 720})
        try:
            test_gizmo_handles(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
