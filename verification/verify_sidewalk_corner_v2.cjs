const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
        console.log('Navigating...');
        await page.goto('http://localhost:5173');
        await page.waitForSelector('canvas');

        console.log('Setup Dev Mode...');
        await page.evaluate(() => {
            window.app.devMode.enable();
            window.app.devMode.clearMap();
            // Set time to noon for visibility
            window.app.world.timeCycle.time = 12;
            window.app.world.timeCycle.update(0); // Force update
        });

        // Wait for clear
        await page.waitForTimeout(500);

        console.log('Placing entities...');
        await page.evaluate(() => {
            // Place Corner at 0,0,0
            window.app.devMode.clipboard = {
                type: 'sidewalk_corner',
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 },
                uuid: 'corner-1',
                params: {}
            };
            window.app.devMode.pasteClipboard();

            // Place Sidewalk at 0,0,3
            window.app.devMode.clipboard = {
                type: 'sidewalk',
                position: { x: 0, y: 0, z: 3 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 },
                uuid: 'sidewalk-1',
                params: {}
            };
            window.app.devMode.pasteClipboard();

            // Position Camera
             if (window.app.devMode.camera) {
                 window.app.devMode.camera.position.set(2, 2, 2);
                 window.app.devMode.camera.lookAt(0, 0, 1);
            }
        });

        // Search in palette
        console.log('Searching palette...');
        await page.fill('#dev-palette-search', 'Sidewalk Corner');

        await page.waitForTimeout(1000);

        const screenshotPath = path.join(process.cwd(), 'verification/sidewalk_corner_v2.png');
        await page.screenshot({ path: screenshotPath });
        console.log(`Screenshot saved to ${screenshotPath}`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
})();
