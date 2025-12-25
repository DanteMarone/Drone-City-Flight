
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // 1. Navigate
    await page.goto('http://localhost:5173');

    // 2. Enable Dev Mode & Spawn Objects
    await page.evaluate(async () => {
        // Wait for app
        while (!window.app || !window.app.world) {
            await new Promise(r => setTimeout(r, 100));
        }

        window.app.devMode.enable();
        window.app.devMode.clearMap();

        // Wait for clear
        await new Promise(r => setTimeout(r, 200));

        // Spawn objects via loadMap hack
        const mapData = {
            objects: [
                {
                    type: 'constructionBarrier', // confirmed valid file
                    params: { uuid: 'obj1' },
                    transform: { position: { x: -5, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
                },
                {
                    type: 'constructionBarrier',
                    params: { uuid: 'obj2' },
                    transform: { position: { x: 5, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
                }
            ],
            history: [],
            rings: []
        };

        window.app.loadMap(mapData);
    });

    // 3. Select Objects
    await page.waitForTimeout(2000); // Wait for objects to spawn
    await page.evaluate(() => {
        const objects = window.app.world.colliders
            .filter(c => c.mesh && (c.mesh.userData.uuid === 'obj1' || c.mesh.userData.uuid === 'obj2'))
            .map(c => c.mesh);

        if (objects.length > 0) {
            window.app.devMode.selectObjects(objects);
        } else {
            console.error('Could not find objects to select!');
        }
    });

    // 4. Verify UI
    await page.waitForTimeout(1000);

    // Check if Align Tool is visible
    const alignVisible = await page.isVisible('#dev-align-container');
    console.log(`Align Tool Visible: ${alignVisible}`);

    // Check if Properties Panel is open
    const panelOpen = await page.evaluate(() => {
        return document.getElementById('prop-panel').classList.contains('open');
    });
    console.log(`Panel Open: ${panelOpen}`);

    // Take screenshot
    await page.screenshot({ path: 'verification/align_tool.png' });

    await browser.close();
})();
