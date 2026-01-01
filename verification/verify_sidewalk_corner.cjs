const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Set viewport size
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
        console.log('Navigating to app...');
        await page.goto('http://localhost:5173');

        // Wait for app to load (checking for canvas)
        await page.waitForSelector('canvas');
        console.log('App loaded.');

        // Enable Dev Mode
        console.log('Enabling Dev Mode...');
        await page.evaluate(() => {
            window.app.devMode.enable();
            // Clear map to remove default objects for clean view
            window.app.devMode.clearMap();
        });

        // Wait a bit for UI to settle
        await page.waitForTimeout(1000);

        // Place Sidewalk Corner
        console.log('Placing Sidewalk Corner...');
        await page.evaluate(() => {
            // Simulate selecting "Sidewalk Corner" from palette logic
            // We can't click easily without knowing where it is, so we'll instantiate via console
            // simulating a placement.

            // Actually, let's use the EntityRegistry to spawn one in the center
            const EntityRegistry = window.app.world.constructor.name === 'World' ? null : null; // Accessing internal modules is hard

            // We can use World.addEntity directly if we can construct it.
            // Since we can't import classes easily here, we'll rely on the clipboard trick or EntityRegistry lookup if exposed?
            // EntityRegistry is not exposed.

            // However, we can use the "loadMap" trick or "pasteClipboard" trick.
            // Let's try pasting from clipboard.

            const entityData = {
                type: 'sidewalk_corner',
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 },
                uuid: 'temp-corner-1',
                params: {}
            };

            window.app.devMode.clipboard = entityData;
            window.app.devMode.pasteClipboard();

            // Move camera to look at it
            // Check if devCamera exists and has position
            if (window.app.devMode.camera) {
                 window.app.devMode.camera.position.set(2, 2, 2);
                 window.app.devMode.camera.lookAt(0, 0, 0);
            }
        });

        // Wait for placement
        await page.waitForTimeout(1000);

        // Take screenshot
        const screenshotPath = path.join(process.cwd(), 'verification/sidewalk_corner.png');
        await page.screenshot({ path: screenshotPath });
        console.log(`Screenshot saved to ${screenshotPath}`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
})();
