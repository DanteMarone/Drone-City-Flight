from playwright.sync_api import sync_playwright, expect

def verify_hud():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:5173")

            # Wait for HUD
            hud = page.locator(".hud-container")
            expect(hud).to_be_visible()

            # Check Battery
            batt = page.locator("#hud-batt-text")
            expect(batt).to_contain_text("100%")

            # Simulate flight (keyboard) to drain battery/change speed
            page.keyboard.press("Shift") # Start boosting to drain
            page.keyboard.down("ArrowUp")
            page.wait_for_timeout(2000)
            page.keyboard.up("ArrowUp")

            # Screenshot
            page.screenshot(path="verification/hud_active.png")
            print("Screenshot saved to verification/hud_active.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_hud()
