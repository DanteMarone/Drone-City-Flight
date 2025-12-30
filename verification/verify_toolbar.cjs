
const { chromium } = require('playwright');
const path = require('path');

async function run() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Navigate to localhost:5173
        console.log('Navigating to app...');
        await page.goto('http://localhost:5173');

        // Wait for app to load (checking for canvas)
        await page.waitForSelector('canvas', { timeout: 30000 });

        // Enable Dev Mode using the console as described in memories
        console.log('Enabling Dev Mode...');
        await page.evaluate(() => {
             if (window.app && window.app.devMode) {
                 window.app.devMode.enable();
             }
        });

        // Wait for Dev UI to appear
        await page.waitForSelector('#dev-ui', { state: 'visible', timeout: 5000 });

        // Locate the Toolbar
        const toolbar = await page.locator('.dev-toolbar');

        // Take a screenshot of the toolbar area to verify buttons
        console.log('Taking screenshot...');
        await page.screenshot({ path: path.join(__dirname, 'dev_toolbar.png') });

        // Also verify the buttons exist in DOM
        const roadBtn = toolbar.locator('div', { hasText: 'Road' });
        const riverBtn = toolbar.locator('div', { hasText: 'River' });

        const roadCount = await roadBtn.count();
        const riverCount = await riverBtn.count();

        console.log(`Road buttons found: ${roadCount}`);
        console.log(`River buttons found: ${riverCount}`);

        if (roadCount > 0 && riverCount > 0) {
            console.log('SUCCESS: Road and River buttons present.');
        } else {
            console.error('FAILURE: Buttons missing.');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
}

run();
