from playwright.sync_api import sync_playwright, expect
import time

def verify_picnic_table():
    with sync_playwright() as p:
        # Launch browser (can be headless)
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Load the app
        print("Loading app...")
        page.goto("http://localhost:5173/") # Assuming default Vite port

        # Wait for canvas to be ATTACHED (it seems visible check is failing even if it is there)
        # But we proved it exists with eval_on_selector
        print("Waiting for app init...")
        time.sleep(5)

        # 2. Enable Dev Mode
        print("Enabling Dev Mode...")
        page.keyboard.press("Backquote") # Press `

        # Wait for Dev UI to appear
        try:
            page.wait_for_selector("#dev-ui", state="visible", timeout=5000)
        except Exception as e:
            print(f"Dev UI not visible: {e}")
            print(page.content())
            page.screenshot(path="debug_dev_ui_fail.png")
            exit(1)

        # 3. Search for Picnic Table
        print("Searching for Picnic Table...")
        # Type in search box
        try:
            page.fill("#dev-palette-search", "Picnic Table")
        except Exception as e:
            print(f"Search input failed: {e}")
            page.screenshot(path="debug_search_fail.png")
            exit(1)

        # Wait a moment for filter
        time.sleep(2)

        # 4. Verify the item exists in the palette
        # Look for a button with text "Picnic Table" or aria-label containing it
        # We need to use filter because class is shared
        picnic_btn = page.locator(".dev-palette-item").filter(has_text="Picnic Table").first

        if picnic_btn.count() > 0 and picnic_btn.is_visible():
            print("SUCCESS: Picnic Table found in palette!")

            # Take a screenshot of the palette
            page.screenshot(path="verification_picnic_table.png")
            print("Screenshot saved to verification_picnic_table.png")

        else:
            print("FAILURE: Picnic Table NOT found in palette.")
            print(f"Found count: {picnic_btn.count()}")
            # Print available items
            items = page.locator(".dev-palette-item .dev-palette-name").all_text_contents()
            print(f"Available items: {items}")
            page.screenshot(path="verification_failure.png")
            exit(1)

        browser.close()

if __name__ == "__main__":
    verify_picnic_table()
