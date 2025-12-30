
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

        # Simulate selecting Road Tool and placing a road
        # We'll do this via direct JS manipulation to simulate the "Anchor & Stretch" logic
        # avoiding the mouse drag complexity for this specific property test

        print("Placing Road...")
        result = await page.evaluate("""() => {
            const devMode = window.app.devMode;
            const interaction = devMode.interaction;

            // Mock placement flow
            devMode.setPlacementMode('road');

            // 1. Mouse Down (Anchor)
            interaction._handlePlacementMouseDown({
                clientX: 0, clientY: 0, // Mock coords, raycast will map to world 0,0 roughly
                target: window.app.renderer.domElement
            });

            // Force anchor to 0,0,0 for predictability
            if (interaction.activePlacement) {
                interaction.activePlacement.anchor.set(0, 0, 0);
            }

            // 2. Mouse Move (Stretch to 5.2 units)
            // We'll call _updatePlacementGhost directly with a point
            interaction._updatePlacementGhost({ x: 0, y: 0, z: 5.2 }); // Should snap to 5

            // Capture Ghost Scale
            const ghostScaleZ = interaction.ghostMesh ? interaction.ghostMesh.scale.z : -1;

            // 3. Mouse Up (Commit)
            interaction._handlePlacementMouseUp({});

            // Find the last created entity
            const entities = window.app.world.entities;
            const lastEntity = entities[entities.length - 1];

            // Wait, we need to find the one we just made.
            // It should be the last one in the list.

            return {
                ghostScaleZ: ghostScaleZ,
                finalScaleZ: lastEntity.mesh.scale.z,
                type: lastEntity.type
            };
        }""")

        print(f"Result: {json.dumps(result, indent=2)}")

        if result['ghostScaleZ'] == 5 and result['finalScaleZ'] == 5:
            print("SUCCESS: Road snapped to integer length 5.")
        else:
            print("FAILURE: Road did not snap correctly.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
