from playwright.sync_api import sync_playwright, expect

def verify_fix():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:5173")

            # Verify Tutorial Box still appears (game loaded)
            tbox = page.locator(".tutorial-box")
            expect(tbox).to_be_visible()

            # Screenshot
            page.screenshot(path="verification/fix_verified.png")
            print("Screenshot saved")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_fix()
