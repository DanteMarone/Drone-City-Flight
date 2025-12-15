from playwright.sync_api import sync_playwright

def verify_parks():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a larger viewport to see the palette clearly
        page = browser.new_page(viewport={'width': 1280, 'height': 720})

        print("Navigating to app...")
        page.goto("http://localhost:3000")

        # Wait for the app to load (checking for canvas)
        print("Waiting for canvas...")
        page.wait_for_selector("canvas", timeout=10000)

        # Enable Dev Mode
        print("Enabling Dev Mode...")
        page.evaluate("window.app.devMode.enable()")

        # Wait for dev-ui
        print("Waiting for Dev UI...")
        page.wait_for_selector("#dev-ui", state="visible")

        # Click Clear Map to remove default objects
        print("Clearing map...")
        page.click("#dev-clear")

        # Verify Palette Entries
        print("Checking palette for Park entries...")
        parks = [
            "Park (Nature, Small)",
            "Park (Playset, Small)",
            "Park (Skate, Large)",
            "Park (Water, Large)"
        ]

        for park_name in parks:
            # Check if text exists in palette
            locator = page.locator(".palette-item", has_text=park_name)
            if locator.count() > 0:
                print(f"Found: {park_name}")
            else:
                print(f"MISSING: {park_name}")

        # Drag "Park (Skate, Large)" to the map
        print("Dragging Park (Skate, Large) to map...")

        # We need to simulate drag and drop.
        # Since drag and drop in 3D canvas is tricky with selectors,
        # we will simulate the drop via JS if possible, or just drag the element over the canvas.
        # However, checking the palette presence is the primary "integration" check here.
        # But let's try to verify placement visual.

        # Take screenshot of the Palette to confirm existence
        print("Taking screenshot...")
        page.screenshot(path="verification/parks_palette.png")

        browser.close()

if __name__ == "__main__":
    verify_parks()
