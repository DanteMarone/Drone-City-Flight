from playwright.sync_api import sync_playwright
import time

def verify_birds_bushes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Note: Depending on environment, may need --no-sandbox or similar args
        # browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-setuid-sandbox'])

        page = browser.new_page()

        # 1. Navigate to app
        page.goto("http://localhost:5173")

        # Wait for loading (simple sleep or check for canvas)
        page.wait_for_selector("canvas", state="visible")
        time.sleep(2) # Allow initialization

        # 2. Enter Dev Mode
        # The app listens for '`' or we can click button if exposed?
        # Actually Dev Mode is hidden initially.
        # But we can simulate key press `Backquote` (~)
        # Or expose a global to toggle it?
        # The instruction says "Have absolute certainty".
        # Let's try key press.
        page.keyboard.press("Backquote")
        time.sleep(1)

        # 3. Check if Palette has Bird and Bush
        # They are .palette-item[data-type="bird"] and [data-type="bush"]
        bird_item = page.locator('.palette-item[data-type="bird"]')
        bush_item = page.locator('.palette-item[data-type="bush"]')

        if bird_item.is_visible() and bush_item.is_visible():
            print("Bird and Bush palette items are visible.")
        else:
            print("Error: Palette items not found.")

        # 4. Take Screenshot of UI
        page.screenshot(path="verification/dev_ui_birds.png")

        browser.close()

if __name__ == "__main__":
    verify_birds_bushes()
