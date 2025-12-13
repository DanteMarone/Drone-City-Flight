from playwright.sync_api import sync_playwright

def verify_bicycle(page):
    # Go to app
    page.goto("http://localhost:5173")

    # Wait for canvas (app loaded)
    page.wait_for_selector("canvas", timeout=10000)

    # Enable Dev Mode
    # The app likely listens to a key (config says '`' or F1 maybe?)
    # Or I can execute JS to enable it if I find the global hook.
    # Looking at src/main.js might reveal window.app.
    # Let's try to enable it via JS: window.app.devMode.enable()

    # Wait a bit for initialisation
    page.wait_for_timeout(2000)

    # Execute JS to enable dev mode
    page.evaluate("if (window.app && window.app.devMode) window.app.devMode.enable()")

    # Wait for dev-ui
    page.wait_for_selector("#dev-ui", state="visible", timeout=5000)

    # Check if Bicycle is in palette
    bicycle_item = page.locator(".palette-item[data-type='bicycle']")
    if bicycle_item.count() > 0:
        print("Bicycle item found in palette")
    else:
        print("Bicycle item NOT found")
        exit(1)

    # Take screenshot of the palette with Bicycle
    page.screenshot(path="verification/bicycle_palette.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_bicycle(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
