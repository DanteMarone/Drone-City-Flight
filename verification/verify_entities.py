import time
from playwright.sync_api import sync_playwright

def verify_entities():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the preview server (usually 4173 for Vite preview)
        page.goto("http://localhost:4173")

        # Wait for app to load (checking for canvas)
        page.wait_for_selector("canvas", timeout=10000)

        # Enable Dev Mode
        page.evaluate("window.app.devMode.enable()")
        time.sleep(1) # Wait for UI transition

        # Take a screenshot of the Palette to see if our items are listed
        # The Palette is in the Dev Mode UI.
        # We can also verify by text content.

        print("Checking for entity names...")

        entities = [
            "Delivery Van",
            "Radio Tower",
            "Neon Sign",
            "Industrial HVAC",
            "Drone Landing Pad"
        ]

        missing = []
        for name in entities:
            # We look for the text in the palette items
            # Palette items are likely divs or buttons.
            # Using verify strictness=False to find text anywhere
            found = page.get_by_text(name, exact=False).is_visible()
            if found:
                print(f"Found: {name}")
            else:
                print(f"MISSING: {name}")
                missing.append(name)

        # Capture screenshot of the UI
        page.screenshot(path="verification/entity_palette.png")

        browser.close()

        if missing:
            raise Exception(f"Missing entities: {missing}")

if __name__ == "__main__":
    verify_entities()
