const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Wait for the server to be ready (a simple timeout for now, or retry logic)
    // Assuming server is running on 5173 as per standard Vite
    const url = 'http://localhost:5173';

    try {
        await page.goto(url, { waitUntil: 'networkidle' });

        // Wait for app to initialize
        await page.waitForTimeout(3000);

        // Execute script to enable dev mode and spawn object
        await page.evaluate(() => {
            if (window.app && window.app.devMode) {
                window.app.devMode.enable();

                // Manually spawn a shipping container
                // We can't access ShippingContainerEntity class directly if it's not global
                // But we can use the clipboard logic or World.addEntity if we can construct it.
                // Or we can use EntityRegistry if it's exposed? No.
                // Best way: use loadMap logic or create a "fake" save object.

                // Let's try to access EntityRegistry via internal map if possible?
                // No, modules are closed.

                // However, we added it to 'index.js', so if we can use the type string 'shippingContainer'.
                // window.app.world.loadMap({ objects: [...] }) might work but it clears the world.

                // Let's use the DevMode clipboard hack from memory:
                // "Frontend verification scripts can bypass restricted EntityRegistry access by using window.app.world.loadMap() with a crafted JSON payload to spawn entities."

                // Wait, loadMap clears everything. That's fine for a screenshot.

                const mapData = {
                    objects: [
                        {
                            type: 'shippingContainer',
                            uuid: 'verify-container-1',
                            pos: { x: 0, y: 1.3, z: -10 }, // In front of camera
                            rot: { x: 0, y: 0.5, z: 0 },
                            scale: { x: 1, y: 1, z: 1 },
                            params: {
                                color: '#CC6600',
                                lengthType: 20,
                                logoText: 'TEST-LOGISTICS'
                            }
                        }
                    ],
                    rings: [],
                    history: []
                };

                window.app.world.loadMap(mapData);
            }
        });

        // Wait for load
        await page.waitForTimeout(1000);

        // Position camera to see it
        await page.evaluate(() => {
            if (window.app && window.app.drone && window.app.drone.camera) {
                const cam = window.app.drone.camera;
                cam.position.set(0, 5, 10);
                cam.lookAt(0, 1.3, -10);
            }
        });

        await page.waitForTimeout(500);

        await page.screenshot({ path: path.join(__dirname, 'verification_container.png') });
        console.log('Screenshot taken');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
})();
