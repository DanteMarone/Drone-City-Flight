const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Set a large viewport to see the dev UI
    await page.setViewportSize({ width: 1920, height: 1080 });

    try {
        console.log('Navigating to app...');
        await page.goto('http://localhost:5173');
        await page.waitForLoadState('networkidle');

        // Wait for app to be ready
        await page.waitForTimeout(2000);

        // Enable Dev Mode via console
        console.log('Enabling Dev Mode...');
        await page.evaluate(() => {
            if (window.app && window.app.devMode) {
                window.app.devMode.enable();
            } else {
                console.error('App or DevMode not found');
            }
        });

        await page.waitForTimeout(1000);

        // Select an object with color (Neon Sign)
        console.log('Creating Neon Sign...');
        await page.evaluate(() => {
            // Neon Signs might not be in default map. Let's create one.
            const entity = new window.app.world.entityRegistry.entries['neonSign'].class({
                pos: { x: 0, y: 10, z: 0 },
                color: 0x00ff00
            });
            entity.init(window.app.world);
            window.app.world.addEntity(entity);
            window.app.colliderSystem.addStatic([entity]);

            // Select it
            window.app.devMode.selectObject(entity.mesh);
        });

        await page.waitForTimeout(1000);

        // Check for Color Picker in Inspector
        const colorPicker = page.locator('.dev-color-picker-container');
        if (await colorPicker.count() > 0) {
            console.log('✅ Color Picker detected!');
        } else {
            console.error('❌ Color Picker NOT found');
        }

        // Take screenshot
        await page.screenshot({ path: 'verification/color_picker_evidence_v2.png' });
        console.log('Screenshot saved to verification/color_picker_evidence_v2.png');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
        process.exit(0);
    }
})();
