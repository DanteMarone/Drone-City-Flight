from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the game
        page.goto("http://localhost:5173")

        # Wait for game to load
        page.wait_for_timeout(5000)

        # Enter Dev Mode
        page.keyboard.press("Backquote")
        page.wait_for_timeout(1000)

        # 1. Place a Car
        page.evaluate("""
            const pt = {x: 0, z: -10};
            window.app.devMode.interaction.factory.createCar(pt);
            // We need to select it to add waypoints
            // The last added collider is the car
            // Wait, createCar does not automatically add to colliders unless dropped.
            // InteractionManager.setupDragDrop handles the add.
            // Direct calling createCar returns {mesh, box} but doesn't add to world.
            // We must add it manually.
            const res = window.app.devMode.interaction.factory.createCar(pt);
            if (res) {
                 window.app.world.colliders.push(res);
                 window.app.colliderSystem.addStatic([res]);
                 window.app.renderer.scene.add(res.mesh); // Factory adds to scene? Yes.
                 window.app.devMode.selectObject(res.mesh);
                 // Ensure visuals visible
                 const visuals = res.mesh.getObjectByName('waypointVisuals');
                 if (visuals) visuals.visible = true;
            }
        """)

        page.wait_for_timeout(500)

        # 2. Add Waypoints
        page.click("#btn-add-waypoint")
        page.wait_for_timeout(200)
        page.click("#btn-add-waypoint")
        page.wait_for_timeout(200)

        # Take screenshot of Dev Mode with path
        page.screenshot(path="verification/dev_mode_path.png")
        print("Dev Mode path screenshot taken.")

        # 4. Exit Dev Mode to start simulation
        page.keyboard.press("Backquote")
        page.wait_for_timeout(500)

        # 5. Wait for car to move
        page.wait_for_timeout(2000)

        # Screenshot of Normal Mode (Car should have moved)
        page.screenshot(path="verification/normal_mode_moved.png")
        print("Normal Mode moved screenshot taken.")

        # Check car position via JS
        pos = page.evaluate("""
            (() => {
                const cars = window.app.world.colliders.filter(c => c.mesh.userData.type === 'car');
                if (cars.length === 0) return null;
                const car = cars[cars.length-1].mesh;
                // Get position of the BODY (child) relative to World, or just check if children moved.
                const visualGroup = car.getObjectByName('waypointVisuals');
                const modelChildren = car.children.filter(child => child !== visualGroup);
                const body = modelChildren[0];
                return body.position;
            })()
        """)

        print(f"Car Body Position: {pos}")

        if pos and (abs(pos['x']) > 0.1 or abs(pos['z']) > 0.1):
            print("SUCCESS: Car has moved from origin.")
        else:
            print("FAILURE: Car is still at origin.")

        browser.close()

if __name__ == "__main__":
    run()
