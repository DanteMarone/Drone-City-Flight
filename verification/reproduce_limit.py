from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Determine URL
        url = "http://localhost:5173"
        print(f"Navigating to {url}")
        page.goto(url)

        # Wait for app to be ready
        page.wait_for_selector('canvas')
        page.wait_for_timeout(2000) # Wait for init

        print("Injecting test script...")

        result = page.evaluate("""() => {
            const app = window.app;
            if (!app || !app.devMode || !app.devMode.interaction) return "App not ready";

            const factory = app.devMode.interaction.factory;
            const interaction = app.devMode.interaction;

            let count = 0;
            const limit = 200;
            const added = [];

            for (let i = 0; i < limit; i++) {
                const x = (i % 20) * 20 - 200; // Grid layout
                const z = Math.floor(i / 20) * 20 - 200;

                const type = (i % 3 === 0) ? 'house' : 'road';

                // Emulate src/dev/interaction.js logic
                const entity = factory.createObject(type, { x, z });

                if (entity && entity.mesh) {
                    app.world.addEntity(entity);
                    if (app.colliderSystem) {
                        app.colliderSystem.addStatic([entity]);
                    }
                    added.push(type);
                } else {
                    console.error("Failed to create object at index " + i);
                }
            }

            return {
                created: added.length,
                colliders: app.world.colliders.length,
                sceneChildren: app.renderer.scene.children.length,
                staticColliders: app.colliderSystem.staticColliders.length
            };
        }""")

        print(f"Test Result: {result}")

        # Take screenshot
        page.screenshot(path="verification/limit_test.png")

        browser.close()

if __name__ == "__main__":
    run()
