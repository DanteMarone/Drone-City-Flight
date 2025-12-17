
import time
from playwright.sync_api import sync_playwright

def verify_fire_station():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Grant permissions to avoid notification prompts
        context = browser.new_context(permissions=['clipboard-read', 'clipboard-write'])
        page = context.new_page()

        print("Navigating to app...")
        # Assuming port 5173 based on standard Vite dev server
        page.goto("http://localhost:5173")

        # Wait for app to load (checking for canvas or specific UI element)
        page.wait_for_selector("canvas", state="visible", timeout=30000)

        # Give it a moment to initialize
        time.sleep(5)

        print("Enabling Dev Mode...")
        # Enable Dev Mode via console
        page.evaluate("window.app.devMode.enable()")
        time.sleep(2)

        # We need to spawn the fire station.
        # Since I cannot easily use the UI drag/drop in a headless script without complex coordinate logic,
        # I will spawn it programmatically using window.app.world.addEntity
        # but I need to make sure the class is available.
        # The classes are not globally exposed, but EntityRegistry is internal.
        # However, I can use the same method the save system uses: World.loadMap or just addEntity if I can access it.

        # Actually, DevMode usually exposes some way to create objects, or I can use the 'paste' trick from memory
        # "Frontend verification scripts can bypass restricted EntityRegistry access by using
        # window.app.world.loadMap() with a crafted JSON payload to spawn entities."

        print("Spawning Fire Station via loadMap hack...")

        spawn_script = """
        const fireStationData = {
            id: 'fire_station_test',
            type: 'fire_station',
            pos: [0, 0, -20],
            rot: [0, 0, 0, 1],
            scale: [1, 1, 1],
            params: { width: 18, depth: 14, height: 8 },
            uuid: 'test-uuid-fs'
        };

        // Use loadMap to inject it. But loadMap clears everything.
        // That is fine, we just want to see the building.
        // We need to match the map structure: { objects: [], rings: [], history: [] }

        const mapData = {
            objects: [fireStationData],
            rings: [],
            history: []
        };

        window.app.world.loadMap(mapData);

        // Move camera to see it
        // The object is at 0, 0, -20.
        // The main camera is window.app.drone.camera when in drone mode.
        // But when DevMode is active, it uses window.app.devMode.camera.

        const cam = window.app.devMode.camera;
        if (cam) {
            cam.position.set(20, 20, 20); // Side view
            cam.lookAt(0, 5, -20);
            cam.updateMatrixWorld();
        } else {
             console.error("Dev camera not found!");
        }
        """

        page.evaluate(spawn_script)

        time.sleep(2)

        print("Taking screenshot...")
        page.screenshot(path="verification/fire_station.png")

        browser.close()

if __name__ == "__main__":
    verify_fire_station()
