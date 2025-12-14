from playwright.sync_api import sync_playwright

def verify_ux_change():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate
        page.goto("http://localhost:5173/")

        # Wait for app init
        page.wait_for_selector("#ui-layer", timeout=30000)

        # Force the menu to show via JS to bypass input system issues
        # The menu creation might take a moment if it's async (unlikely here)
        # But let's check if 'pause-menu' exists

        print("Waiting for pause-menu...")
        try:
             # Wait until #pause-menu is in the DOM (it is created in MenuSystem ctor)
             page.wait_for_selector("#pause-menu", state="attached", timeout=10000)
        except:
             print("pause-menu not found in DOM!")
             print(page.content())
             return

        # Force toggle
        print("Showing menu via JS...")
        page.evaluate("document.getElementById('pause-menu').classList.remove('hidden')")

        # Verify visibility (for sanity)
        if page.locator("#pause-menu").is_visible():
             print("Menu is visible.")
        else:
             print("Menu is NOT visible.")

        # Check input
        file_input = page.locator("#btn-load-map")

        # Debug attributes
        print(f"Class: {file_input.get_attribute('class')}")
        print(f"Style: {file_input.get_attribute('style')}")

        is_visually_hidden = "visually-hidden" in (file_input.get_attribute("class") or "")
        is_display_none = "display: none" in (file_input.get_attribute("style") or "") or "display:none" in (file_input.get_attribute("style") or "")

        if is_visually_hidden:
            print("SUCCESS: Input has visually-hidden class")
        else:
            print("FAILURE: Input missing visually-hidden class")

        if not is_display_none:
            print("SUCCESS: Input does not have display: none")
        else:
            print("FAILURE: Input still has display: none")

        page.screenshot(path="verification/menu_ux.png")
        print("Screenshot saved to verification/menu_ux.png")
        browser.close()

if __name__ == "__main__":
    verify_ux_change()
