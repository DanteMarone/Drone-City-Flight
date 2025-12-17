
import asyncio
from playwright.async_api import async_playwright
import json

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Connect to the running app
        try:
            await page.goto("http://localhost:5173", timeout=60000)
            await page.wait_for_load_state("networkidle")
        except Exception as e:
            print(f"Error connecting: {e}")
            await browser.close()
            return

        # Wait for app initialization
        await page.wait_for_function("window.app && window.app.world && window.app.world.entities")

        # Enable Dev Mode
        await page.evaluate("window.app.devMode.enable()")

        # Simulate selecting Road Tool and placing a road with length 5.2 (should snap to 6 now)

        print("Placing Road (testing even snap)...")
        result = await page.evaluate("""() => {
            const devMode = window.app.devMode;
            const interaction = devMode.interaction;

            // Mock placement flow
            devMode.setPlacementMode('road');

            // 1. Mouse Down (Anchor)
            interaction._handlePlacementMouseDown({
                clientX: 0, clientY: 0,
                target: window.app.renderer.domElement
            });

            if (interaction.activePlacement) {
                interaction.activePlacement.anchor.set(0, 0, 0);
            }

            // 2. Mouse Move (Stretch to 5.2 units)
            // Should snap to 6 (Nearest even to 5 is 4 or 6? 5.2 rounds to 5? Round(5.2/2)*2 => Round(2.6)*2 => 3*2 = 6.
            // If 4.8 => Round(2.4)*2 => 2*2 = 4.

            interaction._updatePlacementGhost({ x: 0, y: 0, z: 5.2 });

            // Capture Ghost Scale
            const ghostScaleZ = interaction.ghostMesh ? interaction.ghostMesh.scale.z : -1;

            return {
                ghostScaleZ: ghostScaleZ
            };
        }""")

        print(f"Result: {json.dumps(result, indent=2)}")

        if result['ghostScaleZ'] == 6:
            print("SUCCESS: Road snapped to even length 6.")
        else:
            print(f"FAILURE: Road snapped to {result['ghostScaleZ']}, expected 6.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
