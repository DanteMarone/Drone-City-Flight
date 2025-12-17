
import asyncio
from playwright.async_api import async_playwright
import json

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            # Go to app
            await page.goto("http://localhost:5173", timeout=30000)

            # Simple wait for app to be ready
            await page.wait_for_selector("canvas", timeout=30000)
            await page.wait_for_function("window.app && window.app.world && window.app.drone", timeout=30000)

            # Enable Dev Mode
            await page.evaluate("window.app.devMode.enable()")

            result = await page.evaluate("""() => {
                const devMode = window.app.devMode;
                const interaction = devMode.interaction;

                devMode.setPlacementMode('road');

                // Get constructor from existing object
                const Vector3 = window.app.drone.mesh.position.constructor;

                interaction.activePlacement = {
                    anchor: new Vector3(0, 0, 0),
                    type: 'road'
                };

                // 2. Mock Mouse Move (Stretch to 5.2 units)
                interaction._createGhost('road');
                interaction._updatePlacementGhost(new Vector3(0, 0, 5.2));
                const scaleZ_5 = interaction.ghostMesh.scale.z;

                // 3. Mock Mouse Move (Stretch to 1.9 units)
                interaction._updatePlacementGhost(new Vector3(0, 0, 1.9));
                const scaleZ_2 = interaction.ghostMesh.scale.z;

                 // 4. Mock Mouse Move (Stretch to 0.4 units)
                interaction._updatePlacementGhost(new Vector3(0, 0, 0.4));
                const scaleZ_1 = interaction.ghostMesh.scale.z;

                return {
                    snap_5: scaleZ_5,
                    snap_2: scaleZ_2,
                    snap_1: scaleZ_1
                };
            }""")

            print(f"Result: {json.dumps(result, indent=2)}")

            if result['snap_5'] == 5 and result['snap_2'] == 2 and result['snap_1'] == 1:
                 print("SUCCESS: Road snapped to correct integers.")
            else:
                 print("FAILURE: Road snapping incorrect.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
