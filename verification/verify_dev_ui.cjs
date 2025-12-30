const { chromium } = require('playwright');
const path = require('path');

(async () => {
    // Launch with specific args to help in headless environments if needed
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    try {
        console.log('Navigating to app...');
        await page.goto('http://localhost:5173');

        console.log('Waiting for DOM to be ready...');
        // Use a more generic wait to ensure page is loaded
        await page.waitForLoadState('domcontentloaded');

        // Check for the container directly with getById equivalent
        const container = await page.$('#game-container');
        if (!container) {
             // Fallback debug
             console.log('Body content:', await page.content());
             throw new Error('#game-container not found in DOM');
        }
        console.log('#game-container found.');

        console.log('Checking for window.app...');
        // Wait a bit for JS to execute
        await page.waitForFunction(() => window.app !== undefined, { timeout: 15000 });

        console.log('Enabling Dev Mode...');
        await page.evaluate(() => {
            console.log("Enabling DevMode from script...");
            if (window.app && window.app.devMode) {
                window.app.devMode.enable();
            } else {
                console.error("window.app.devMode missing");
            }
        });

        console.log('Waiting for Dev UI...');
        await page.waitForSelector('#dev-ui', { state: 'visible', timeout: 10000 });

        console.log('Verifying panels...');
        const outliner = await page.waitForSelector('.dev-outliner-content', { state: 'visible' });

        // Take a screenshot
        await page.screenshot({ path: 'verification/dev_ui_refactor.png' });
        console.log('Screenshot captured: verification/dev_ui_refactor.png');

    } catch (error) {
        console.error('Verification failed:', error);
        await page.screenshot({ path: 'verification/error_state.png' });
        process.exit(1);
    } finally {
        await browser.close();
        process.exit(0);
    }
})();
