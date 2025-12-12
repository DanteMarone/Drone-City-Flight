from playwright.sync_api import sync_playwright, expect

def verify_phase3():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:5173")

            # 1. Verify Tutorial Box
            tbox = page.locator(".tutorial-box")
            expect(tbox).to_be_visible()
            expect(tbox).to_contain_text("Welcome Pilot")

            # 2. Pause Game
            page.keyboard.press("Escape")
            menu = page.locator("#pause-menu")
            expect(menu).to_be_visible()
            expect(page.get_by_role("button", name="RESUME")).to_be_visible()

            # Screenshot Menu
            page.screenshot(path="verification/pause_menu.png")

            # 3. Resume
            page.get_by_role("button", name="RESUME").click()
            expect(menu).not_to_be_visible()

            # 4. Wait for Scene with particles (hard to verify logic, but we verify app runs)
            page.wait_for_timeout(1000)

            # Screenshot Gameplay
            page.screenshot(path="verification/gameplay_phase3.png")
            print("Screenshots saved")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_phase3()
