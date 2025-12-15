
from playwright.sync_api import sync_playwright, expect
import time

def verify_menu_accessibility(page):
    # Load the app
    # Note: Vite default port is 5173
    page.goto("http://localhost:5173")

    # Wait for canvas to load (indicates game started)
    page.wait_for_selector("#game-container canvas")

    # Trigger pause menu (Simulate 'Escape' key or verify pause button if visible)
    # The app code listens for 'pause' event from InputManager.
    # InputManager usually maps Escape to pause.
    page.keyboard.press("Escape")

    # Wait for menu to be visible
    menu = page.locator("#pause-menu")
    expect(menu).to_be_visible()

    # Verify Focus Trap: The Resume button should be focused
    resume_btn = page.locator("#btn-resume")
    expect(resume_btn).to_be_focused()

    # Verify Tabbing to "Load Custom Map"
    # Tab order: Resume -> Reset -> Dev Mode -> Load Custom Map (Label)
    page.keyboard.press("Tab") # Reset
    page.keyboard.press("Tab") # Dev Mode
    page.keyboard.press("Tab") # Load Custom Map Label

    # Check if the label is focused
    load_label = page.locator("label.btn-like").filter(has_text="LOAD CUSTOM MAP")
    expect(load_label).to_be_focused()

    # Take screenshot of the focused state
    page.screenshot(path="verification/menu_focus.png")

    print("Verification successful: Menu opened, focus trapped on Resume, and navigated to Load Map button.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_menu_accessibility(page)
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
