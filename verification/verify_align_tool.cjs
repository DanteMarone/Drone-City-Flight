
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // 1. Navigate
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    // 2. Enable Dev Mode & Clear Map
    await page.evaluate(async () => {
        if (window.app && window.app.devMode) {
            window.app.devMode.enable();
            window.app.devMode.clearMap();
            await new Promise(r => setTimeout(r, 100));
        }
    });

    // Wait for Dev UI
    await page.waitForSelector('#dev-ui', { state: 'visible' });

    // 3. Load Map Data with Valid Types (using 'house_modern' which is registered)
    await page.evaluate(async () => {
        const mapData = {
            objects: [
                {
                    type: 'house_modern',
                    params: { uuid: 'obj1' },
                    position: { x: -20, y: 0, z: 0 },
                    rotation: { x: 0, y: 0, z: 0 },
                    scale: { x: 1, y: 1, z: 1 }
                },
                {
                    type: 'house_modern',
                    params: { uuid: 'obj2' },
                    position: { x: 20, y: 0, z: 0 },
                    rotation: { x: 0, y: 0, z: 0 },
                    scale: { x: 1, y: 1, z: 1 }
                }
            ]
        };
        window.app.loadMap(mapData);
        await new Promise(r => setTimeout(r, 500));
    });

    // 4. Select Objects
    const result = await page.evaluate(() => {
        const objects = window.app.world.colliders
            .filter(c => c.mesh && (c.mesh.userData.uuid === 'obj1' || c.mesh.userData.uuid === 'obj2'))
            .map(c => c.mesh);

        if (objects.length === 2) {
            window.app.devMode.selectObjects(objects);

            // Allow DOM update
            return {
                found: objects.length,
                selected: window.app.devMode.selectedObjects.length
            };
        }
        return { found: objects.length };
    });

    console.log('Verification Result:', result);

    // 5. Verify Tool UI Visibility
    // Prop panel should be open
    await page.waitForSelector('#prop-panel.open', { state: 'visible', timeout: 5000 });

    // Align Container should be visible (flex)
    // Note: display:flex check might need computed style
    const alignVisible = await page.evaluate(() => {
        const el = document.getElementById('dev-align-container');
        return el && window.getComputedStyle(el).display !== 'none';
    });
    console.log(`Align Tool Visible: ${alignVisible}`);

    await page.waitForTimeout(500); // Wait for animations

    // 6. Screenshot
    await page.screenshot({ path: 'verification/align_tool_v3.png' });

    await browser.close();
})();
