
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
        await page.waitForLoadState('networkidle');

        // Enable Dev Mode
        console.log('Enabling Dev Mode...');
        await page.evaluate(() => {
            if (window.app && window.app.devMode) {
                window.app.devMode.enable();
            } else {
                console.error('App or DevMode not found on window');
            }
        });

        // Wait for UI
        await page.waitForSelector('#dev-ui', { state: 'visible' });

        const mapData = {
            objects: [
                { type: 'oakTree', position: {x: -5, y: 0, z: 0}, rotation: {x:0,y:0,z:0}, scale: {x:1,y:1,z:1}, params: { uuid: 'obj1' } },
                { type: 'oakTree', position: {x: 5, y: 0, z: 2}, rotation: {x:0,y:0,z:0}, scale: {x:1,y:1,z:1}, params: { uuid: 'obj2' } }
            ],
            history: [],
            rings: []
        };

        console.log('Loading mock map...');
        await page.evaluate((data) => {
            window.app.loadMap(data);
        }, mapData);

        // Wait for objects to exist
        await page.waitForTimeout(1000); // Wait for load

        // Select them
        console.log('Selecting objects...');
        const count = await page.evaluate(() => {
            const objs = window.app.world.colliders
                .filter(c => c.mesh && (c.mesh.userData.uuid === 'obj1' || c.mesh.userData.uuid === 'obj2'))
                .map(c => c.mesh);

            console.log("Found objects:", objs.length);
            if (objs.length > 0) {
                 window.app.devMode.selectObjects(objs);
            }
            return window.app.devMode.selectedObjects.length;
        });

        console.log('Selection count:', count);

        if (count < 2) {
             console.error("Failed to select 2 objects.");
        }

        // Verify Align Tool visibility
        console.log('Waiting for align tool...');

        // Check computed style
        const display = await page.evaluate(() => {
             const el = document.querySelector('#dev-align-container');
             return el ? el.style.display : 'not-found';
        });
        console.log('#dev-align-container display:', display);

        await page.waitForSelector('.dev-align-tool', { state: 'visible', timeout: 5000 });

        // Take screenshot
        console.log('Taking screenshot...');
        await page.screenshot({ path: 'verification/align_tool.png' });

        // Click Align Center X
        console.log('Clicking Align Center X...');
        await page.click('button[data-axis="x"][data-type="center"]');

        // Wait a bit for animation/update
        await page.waitForTimeout(500);

        // Take another screenshot
        await page.screenshot({ path: 'verification/align_tool_result.png' });

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
})();
