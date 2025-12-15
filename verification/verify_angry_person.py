
from playwright.sync_api import sync_playwright
import time
import json

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        try:
            # 1. Go to the app
            page.goto('http://localhost:5173')
            time.sleep(2) # Wait for load

            # 2. Enable Dev Mode
            page.evaluate("""() => {
                if (window.app && window.app.devMode) {
                    window.app.devMode.enable();
                }
            }""")
            time.sleep(0.5)

            # 3. Create Angry Persons using Dev Mode methods
            # Since EntityRegistry is not global, we can't access it directly.
            # But DevMode interaction uses it internally.
            # We can use clipboard paste or mock drag start.
            # Or better, we can invoke InteractionManager's drop logic if we can target it.
            # Easier: Use clipboard.

            page.evaluate("""() => {
                const startX = -10;
                for (let i = 0; i < 4; i++) {
                    const params = {
                        pos: { x: startX + (i * 5), y: 0, z: -10 }
                    };

                    // We need to bypass the lack of global EntityRegistry.
                    // Fortunately devMode has access to it via its import scope? No, scope is module.
                    // BUT, we can use the devMode clipboard mechanism if we can construct the data.

                    // Wait, window.app.devMode.interaction.onDrop calls EntityRegistry?
                    // Let's check interaction.js.
                    // It likely imports EntityRegistry.

                    // However, we can use the 'palette' drag simulation?
                    // No, Playwright drag and drop on canvas is hard.

                    // Let's try to expose EntityRegistry globally just for this session?
                    // No, we can't inject code into the module scope easily.

                    // Alternate: Use `window.app.world.addEntity` but we need an INSTANCE.
                    // If we can't create an instance, we are stuck.

                    // WAIT! `src/world/entities/index.js` exports EntityRegistry.
                    // Maybe it is attached to window somewhere? No.

                    // Is there ANY way to spawn an object via existing global methods?
                    // `window.app.loadMap`!
                    // We can load a mini map json string.

                    const mapData = {
                        objects: [],
                        rings: [],
                        history: []
                    };

                    for (let j = 0; j < 4; j++) {
                        mapData.objects.push({
                            type: 'angryPerson',
                            params: {
                                pos: { x: -10 + (j * 5), y: 0, z: -10 }
                            },
                            uuid: 'test-angry-' + j
                        });
                    }

                    window.app.loadMap(mapData);
                }
            }""")
            time.sleep(1)

            # 4. Select the first one
            page.evaluate("""() => {
                const angryPersons = window.app.world.colliders.filter(e => e.type === 'angryPerson');
                if (angryPersons.length > 0) {
                    window.app.devMode.selectObject(angryPersons[0].mesh);
                }
            }""")
            time.sleep(0.5)

            # 5. Screenshot
            page.screenshot(path='verification/angry_person_test.png', full_page=True)

            # 6. Log properties
            logs = page.evaluate("""() => {
                const angryPersons = window.app.world.colliders.filter(e => e.type === 'angryPerson');
                const results = angryPersons.map(p => ({
                    appearance: p.params.appearance,
                    firingRange: p.params.firingRange,
                    throwInterval: p.params.throwInterval
                }));

                const uiInterval = document.querySelector('#angry-throw-interval')?.value;
                const uiDist = document.querySelector('#angry-throw-dist')?.value;

                return {
                    entities: results,
                    uiInterval,
                    uiDist
                };
            }""")

            print(json.dumps(logs, indent=2))

        except Exception as e:
            print(f"Test failed: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
