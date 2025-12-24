
from playwright.sync_api import sync_playwright

def verify_lighthouse(page):
    # Go to app
    page.goto("http://localhost:5173")

    # Wait for loading
    page.wait_for_timeout(5000)

    # Enable Dev Mode (Backtick)
    page.keyboard.press("Backquote")

    # Wait for UI to appear
    page.wait_for_selector("#dev-ui", state="visible")

    # Take screenshot of the palette to see if "Lighthouse" is listed
    # We might need to scroll or click tabs.
    # The default tab is usually "Residential" or "All".
    # Let's try to find the Lighthouse in the palette.
    # It might be in "Infrastructure" or "Props" or just "All"?
    # The code didn't specify a category, so BuildUI logic handles it.
    # BuildUI often checks keywords. "Lighthouse" might be mapped to "Infrastructure".

    # Let's just take a screenshot of the whole dev UI
    page.screenshot(path="verification/lighthouse_check.png")

    # Try to find the text "Lighthouse"
    try:
        page.get_by_text("Lighthouse").first.hover()
        page.screenshot(path="verification/lighthouse_found.png")
        print("Lighthouse found in palette!")
    except:
        print("Lighthouse not found in initial view. It might be in another tab.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_lighthouse(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
