const { chromium } = require('playwright');
const path = require('path');

(async () => {
    // Launch browser
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'] // Bypass security for local dev
    });
    const page = await browser.newPage();

    try {
        // Go to local dev server
        console.log('Navigating to app...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

        // Wait for canvas
        console.log('Waiting for canvas...');
        await page.waitForSelector('canvas');

        // Enable Dev Mode
        console.log('Enabling Dev Mode...');
        await page.evaluate(() => {
            if (window.app && window.app.devMode) {
                window.app.devMode.enable();
            } else {
                console.error('App or DevMode not found on window');
            }
        });

        // Wait for Dev UI
        await page.waitForSelector('#dev-ui', { state: 'visible' });

        // Switch to World Tab
        console.log('Switching to World Tab...');
        // The tab is inside .dev-inspector-tabs
        // Find element with text "World"
        await page.click('.dev-inspector-tab:has-text("World")');

        // Check for Weather Controls
        const weatherTitle = await page.$('text=Weather');
        if (weatherTitle) console.log('Found Weather Title');
        else console.error('Weather Title NOT found');

        // Wait a bit for rendering
        await page.waitForTimeout(1000);

        await page.screenshot({ path: 'verification/weather_ui.png' });
        console.log('Screenshot saved to verification/weather_ui.png');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
})();
