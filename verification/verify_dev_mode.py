
from playwright.sync_api import sync_playwright, expect

def verify_dev_mode_terminal_removal(page):
    page.goto("http://localhost:4173")

    # Wait for game to load
    page.wait_for_selector("#game-container")

    # Check if Tutorial box is visible initially
    tutorial_box = page.locator(".tutorial-box")
    # It might take a moment to appear or be hidden if local storage was set in a previous run?
    # We should clear local storage first to be sure.
    page.evaluate("localStorage.clear()")
    page.reload()

    expect(tutorial_box).to_be_visible()
    expect(tutorial_box).to_have_text("Welcome Pilot! Use W/S to Ascend/Descend.")

    # Toggle Dev Mode
    page.keyboard.press("Backquote")

    # Wait for Dev Mode UI
    expect(page.locator("#dev-ui")).to_be_visible()

    # Verify Tutorial Box is HIDDEN
    # It should have class 'hidden' or be display: none
    expect(tutorial_box).not_to_be_visible()

    # Verify HUD is HIDDEN
    hud_container = page.locator(".hud-container")
    expect(hud_container).not_to_be_visible()

    # Verify localStorage
    complete_flag = page.evaluate("localStorage.getItem('tutorial_complete')")
    assert complete_flag == 'true', f"Expected tutorial_complete to be 'true', got {complete_flag}"

    # Toggle Dev Mode OFF
    page.keyboard.press("Backquote")

    # Verify Tutorial Box remains HIDDEN (Permanently dismissed)
    expect(tutorial_box).not_to_be_visible()

    # Verify HUD returns (optional, but good to check normal state restoration)
    expect(hud_container).to_be_visible()

    print("Verification Successful!")
    page.screenshot(path="verification/dev_mode_terminal.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_dev_mode_terminal_removal(page)
        except Exception as e:
            print(f"Verification Failed: {e}")
            page.screenshot(path="verification/failure.png")
            raise e
        finally:
            browser.close()
