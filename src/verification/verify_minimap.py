from playwright.sync_api import sync_playwright, Page, expect

def test_minimap(page: Page):
    # Abort FBX loading to prevent timeouts
    page.route("**/*.fbx", lambda route: route.abort())

    # Navigate to app
    page.goto("http://localhost:5173")

    # Wait for app initialization (Map Loaded notification)
    # Using wait_for_timeout as a fallback/stabilizer
    page.wait_for_timeout(5000)

    # Check for Minimap container
    minimap = page.locator(".minimap-container")
    expect(minimap).to_be_visible()

    # Wait a bit more for rendering
    page.wait_for_timeout(2000)

    # Screenshot
    page.screenshot(path="src/verification/minimap_verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        # Use args for WebGL in headless environment
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--enable-unsafe-swiftshader",
                "--use-gl=angle",
                "--use-angle=swiftshader"
            ]
        )
        page = browser.new_page()
        try:
            test_minimap(page)
        finally:
            browser.close()
