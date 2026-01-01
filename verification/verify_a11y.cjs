
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Set viewport to a typical desktop size
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
        console.log('Navigating to app...');
        await page.goto('http://localhost:5173');

        // Wait for app to load
        await page.waitForSelector('#ui-layer');

        console.log('Enabling Dev Mode...');
        // Enable Dev Mode
        await page.evaluate(() => {
            if (window.app && window.app.devMode) {
                window.app.devMode.enable();
            } else {
                throw new Error('DevMode not found');
            }
        });

        // Wait for dev UI
        await page.waitForSelector('#dev-ui');

        console.log('Selecting an object...');
        // Select an object (e.g., Drone or create one)
        // Since we are in empty map, let's create a car using console or assume drone is selectable?
        // Drone is not selectable by default gizmo maybe?
        // Let's create a cube using the palette or direct code
        await page.evaluate(() => {
             // Mock selection of an object to trigger properties panel
             const dummyObj = {
                 uuid: 'test-uuid',
                 userData: {
                     type: 'Test Object',
                     params: { 'Speed': 10, 'Active': true }
                 },
                 position: { x: 0, y: 0, z: 0, clone: () => ({x:0,y:0,z:0}) },
                 rotation: { x: 0, y: 0, z: 0, clone: () => ({x:0,y:0,z:0}) },
                 scale: { x: 1, y: 1, z: 1, clone: () => ({x:1,y:1,z:1}) },
                 updateMatrixWorld: () => {}
             };
             // We need to inject this into devMode.selectedObjects and refresh inspector
             window.app.devMode.selectedObjects = [dummyObj];
             window.app.devMode.ui.inspector.refresh();
        });

        console.log('Checking for accessible inputs...');
        // Wait for properties to render
        await page.waitForSelector('.dev-prop-input');

        // Check for aria-label on vector inputs
        const vectorInputs = await page.$$('.dev-prop-vector input');
        if (vectorInputs.length > 0) {
            const label = await vectorInputs[0].getAttribute('aria-label');
            console.log('Vector Input ARIA Label:', label);
            if (!label) throw new Error('Vector input missing aria-label');
        }

        // Check for label association on scalar inputs
        const scalarLabel = await page.$('label.dev-prop-label');
        if (scalarLabel) {
            const forAttr = await scalarLabel.getAttribute('for');
            console.log('Scalar Label for:', forAttr);
            if (!forAttr) throw new Error('Label missing for attribute');

            const input = await page.$(`#${forAttr}`);
            if (!input) throw new Error('Associated input not found');
        }

        // Take screenshot
        const screenshotPath = path.resolve('verification/dev_mode_a11y.png');
        await page.screenshot({ path: screenshotPath });
        console.log('Screenshot saved to:', screenshotPath);

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
