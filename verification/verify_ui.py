from playwright.sync_api import Page, expect, sync_playwright
import time

def test_dev_ui(page: Page):
    page.on("console", lambda msg: print(f"Console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"Page Error: {err}"))

    # 1. Load game
    page.goto("http://localhost:5173/")

    # Wait for canvas (game loaded)
    page.wait_for_selector("canvas", timeout=30000)

    # 2. Enable Dev Mode via JS to be sure
    page.evaluate("if (window.app && window.app.devMode) window.app.devMode.enable(); else console.error('DevMode not found');")

    # 3. Verify UI appears
    ui = page.locator("#dev-ui")
    expect(ui).to_be_visible()

    # 4. Check Outliner
    outliner = page.locator(".dev-outliner")
    expect(outliner).to_be_visible()

    # 5. Check Inspector
    inspector = page.locator(".dev-inspector")
    expect(inspector).to_be_visible()

    # 6. Check Palette
    palette = page.locator(".dev-palette-container")
    expect(palette).to_be_visible()

    # Wait a bit for thumbnails to render (async)
    time.sleep(2)

    # 7. Screenshot
    page.screenshot(path="verification/dev_ui.png")
    print("Screenshot saved to verification/dev_ui.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_dev_ui(page)
        except Exception as e:
            print(f"Test failed: {e}")
            page.screenshot(path="verification/failure.png")
        finally:
            browser.close()
