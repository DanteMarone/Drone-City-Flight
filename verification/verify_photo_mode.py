from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Load the app (using the build output or local dev server)
    # Assuming 'pnpm run dev' is running on port 5173 or we can access via file if built.
    # Since I don't have the server running in background in this turn, I will assume it needs to be started
    # OR I can just try to run against localhost:5173 if the previous agent left it running.
    # But usually, I need to start it.
    # For now, I'll assume the user instructions implied it, but let's be safe and try to load.

    # Actually, the instructions said "Start the Application". I haven't done that yet.
    # I will do that in the next step. Here is the script content.

    page.goto("http://localhost:5173")

    # 2. Wait for app to load (checking for canvas or UI)
    page.wait_for_selector("#ui-layer")

    # 3. Open Menu (Press Escape)
    page.keyboard.press("Escape")

    # 4. Check for Photo Mode button and click it
    btn_photo = page.locator("#btn-photo")
    expect(btn_photo).to_be_visible()
    btn_photo.click()

    # 5. Verify Photo Mode UI appears
    photo_ui = page.locator(".photo-mode-ui")
    expect(photo_ui).to_be_visible()

    # 6. Check specific elements inside
    expect(page.locator("#pm-snap")).to_be_visible()

    # 7. Take screenshot
    page.screenshot(path="verification/photo_mode_fixed.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
