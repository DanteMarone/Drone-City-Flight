from playwright.sync_api import sync_playwright, expect

def verify_game():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:5173")

            # Wait for canvas to be present
            canvas = page.locator("canvas")
            expect(canvas).to_be_visible()

            # Wait a bit for scene to render
            page.wait_for_timeout(2000)

            # Simulate input: Press Shift to Boost (should show in logic, maybe visual change)
            page.keyboard.press("Shift")
            page.wait_for_timeout(500)

            # Take screenshot of the game state
            page.screenshot(path="verification/game_state.png")
            print("Screenshot saved to verification/game_state.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_game()
