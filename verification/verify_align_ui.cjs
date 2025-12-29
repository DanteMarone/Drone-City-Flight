
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // 1. Go to App
    console.log("Navigating to app...");
    await page.goto('http://localhost:5173');

    // Wait for App to initialize
    await page.waitForFunction(() => window.app && window.app.world);
    console.log("App loaded.");

    // 2. Enable Dev Mode via Console
    console.log("Enabling Dev Mode...");
    await page.evaluate(() => {
        window.app.devMode.enable();
    });

    // 3. Create Objects directly
    console.log("Creating objects...");
    await page.evaluate(() => {
        const createObj = (x, type) => {
            // Mock data for clipboard
            const data = {
                type: type,
                params: { uuid: 'obj_' + x },
                position: { x: x, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 }
            };
            window.app.devMode.clipboard = [data];
            return window.app.devMode.pasteClipboard();
        };

        const o1 = createObj(0, 'busStop');
        const o2 = createObj(10, 'busStop');

        if (o1 && o2) {
            console.log("Objects created successfully");
            // 4. Select Objects
            // We need to pass the MESHES, which are returned by pasteClipboard
            // But pasteClipboard returns an ARRAY of meshes
            const m1 = o1[0];
            const m2 = o2[0];
            window.app.devMode.selectObjects([m1, m2]);
            console.log("Selection set to:", window.app.devMode.selectedObjects.length);
        } else {
            console.error("Failed to create objects");
        }
    });

    // 4. Wait for Align Tool to appear
    console.log("Waiting for Align Tool UI...");
    try {
        // Check for the container ID and that it is not display: none
        await page.waitForFunction(() => {
            const el = document.getElementById('dev-align-container');
            return el && el.style.display !== 'none';
        }, { timeout: 5000 });
        console.log("Align Tool is visible!");
    } catch (e) {
        console.error("Align Tool did not appear within timeout.");
    }

    // 5. Take Screenshot
    const screenshotPath = path.resolve(__dirname, 'verification_align_ui.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to ${screenshotPath}`);

    await browser.close();
})();
