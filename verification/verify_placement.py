
import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # 1. Navigate to the game
            await page.goto("http://localhost:5173")
            await page.wait_for_timeout(2000)

            # 2. Enable Dev Mode
            await page.evaluate("window.app.devMode.enable()")
            await page.wait_for_timeout(1000)

            # 3. Drop a House
            # We use the dispatchEvent method which is more reliable for custom implementations
            x, y = 400, 300
            type_name = 'house'

            initial_count = await page.evaluate("window.app.world.colliders.length")
            print(f"Initial Object Count: {initial_count}")

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
            await page.wait_for_timeout(500)

            final_count = await page.evaluate("window.app.world.colliders.length")
            print(f"Final Object Count: {final_count}")

            if final_count > initial_count:
                print("SUCCESS: Object placed.")
            else:
                print("FAILURE: Object not placed.")

        except Exception as e:
            print(f"ERROR: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
