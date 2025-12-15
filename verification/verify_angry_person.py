
from playwright.sync_api import sync_playwright

def verify_angry_person():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Go to the local server
            page.goto("http://localhost:8080")

            # Wait for app to load (basic check for canvas or UI)
            page.wait_for_selector("canvas", state="visible")

            # Enable Dev Mode
            page.evaluate("window.app.devMode.enable()")

            # Wait for dev-ui
            page.wait_for_selector("#dev-ui", state="visible")

            # Check the palette for "Angry Person"
            # The palette items usually have a title attribute or text content
            # We can search for the text "Angry Person" in the dev-ui

            found = page.locator("#dev-ui").get_by_text("Angry Person").is_visible()

            if found:
                print("Angry Person FOUND in palette.")
            else:
                print("Angry Person NOT FOUND in palette.")

            page.screenshot(path="verification/palette_check.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_angry_person()
