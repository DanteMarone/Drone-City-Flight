
import asyncio
from playwright.async_api import async_playwright

async def verify_bus_stop():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Go to app
        await page.goto("http://localhost:5173")

        # Wait for app to load
        await page.wait_for_selector('canvas', timeout=30000)

        # Enable Dev Mode (Press Backtick)
        await page.keyboard.press("Backquote")
        await page.wait_for_timeout(1000)

        # Check if Bus Stop is in the list
        # We need to find the element that contains "Bus Stop" text in the palette
        # The palette is likely in #dev-ui

        # Try to find the button or list item
        bus_stop_item = page.get_by_text("Bus Stop", exact=True)

        is_visible = await bus_stop_item.is_visible()
        print(f"Bus Stop visible in palette: {is_visible}")

        if is_visible:
            # Click it to select
            await bus_stop_item.click()
            await page.wait_for_timeout(500)

            # We can't easily drag and drop in headless without coordinates,
            # but we can verify it's select-able.

            # Just take a screenshot of the palette with Bus Stop
            await page.screenshot(path="verification/bus_stop_palette.png")

            # Try to spawn it programmatically to see it in world
            await page.evaluate("""
                const entity = new window.app.world.entityRegistry.get('busStop')({});
                window.app.world.addEntity(entity);
                entity.mesh.position.set(0, 10, 0);
                window.app.colliderSystem.addStatic([entity]);
                window.app.devMode.selectObject(entity.mesh);
                window.app.camera.position.set(0, 15, 10);
                window.app.camera.lookAt(0, 10, 0);
            """)

            await page.wait_for_timeout(1000)
            await page.screenshot(path="verification/bus_stop_in_world.png")

        else:
            print("Bus Stop not found in palette")
            # Take screenshot of what IS there
            await page.screenshot(path="verification/palette_failure.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_bus_stop())
