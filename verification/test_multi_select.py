
import asyncio
from playwright.async_api import async_playwright, expect

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # 1. Navigate to the game
        await page.goto("http://localhost:5173")

        # 2. Enable Dev Mode
        # Wait for app to be ready
        await page.wait_for_timeout(2000)
        await page.evaluate("window.app.devMode.enable()")
        await page.wait_for_timeout(1000)

        # 3. Create Objects via Drag and Drop
        # We need to drag from palette to canvas

        # Helper to drag and drop
        async def drag_drop(type_name, x, y):
            # Find palette item
            source = page.locator(f".palette-item[data-type='{type_name}']")

            # Get source position
            box = await source.bounding_box()
            if not box:
                print(f"Could not find palette item {type_name}")
                return

            src_x = box['x'] + box['width'] / 2
            src_y = box['y'] + box['height'] / 2

            # Target is the canvas (body)
            # Center of screen is roughly 0,0, but we need pixel coords.
            # Assuming 800x600 or window size.
            # Let's drop at specific screen locations.

            await page.mouse.move(src_x, src_y)
            await page.mouse.down()
            await page.mouse.move(x, y, steps=10)

            # We need to simulate the dataTransfer event because standard drag drop might not work with the custom setup
            # But the code uses 'dragstart' and 'drop' on body.
            # Playwright drag_and_drop is easier if we trust it triggers events.
            # But let's try manual event dispatch if needed.
            # Actually, standard drag_and_drop often fails with HTML5 DnD.
            # Let's try to inject JS to simulate the drop.

            await page.evaluate(f"""
                const event = new DragEvent('drop', {{
                    bubbles: true,
                    cancelable: true,
                    clientX: {x},
                    clientY: {y},
                    dataTransfer: new DataTransfer()
                }});
                event.dataTransfer.setData('type', '{type_name}');
                document.body.dispatchEvent(event);
            """)
            await page.mouse.up()
            await page.wait_for_timeout(500)

        # Drop a House
        await drag_drop('house', 400, 300) # Center

        # Drop a Car
        await drag_drop('car', 500, 300) # Right of center

        # 4. Select Multiple Objects
        # We need to simulate clicks.
        # Raycasting depends on camera.
        # Dev camera looks down usually? No, it starts at drone pos.
        # Let's assume we can click near where we dropped.

        # Click House (Select One)
        await page.mouse.click(400, 300)
        await page.wait_for_timeout(500)

        # Shift Click Car (Select Two)
        await page.keyboard.down("Shift")
        await page.mouse.click(500, 300)
        await page.keyboard.up("Shift")
        await page.wait_for_timeout(500)

        # 5. Verify Selection Visuals
        # We expect a Group Proxy at centroid and individual spheres
        # We can check window.app.devMode.selectedObjects.length

        count = await page.evaluate("window.app.devMode.selectedObjects.length")
        print(f"Selected Objects Count: {count}")

        proxy_visible = await page.evaluate("window.app.devMode.gizmo.proxy.visible")
        print(f"Proxy Visible: {proxy_visible}")

        # 6. Take Screenshot
        await page.screenshot(path="verification/multi_select_test.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
