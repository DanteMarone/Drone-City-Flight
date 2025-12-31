const { chromium } = require('playwright');

(async () => {
    // Launch browser with WebGL flags
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--use-gl=swiftshader',
            '--enable-unsafe-swiftshader',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('Navigating to app...');
        await page.goto('http://localhost:5173');

        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

        console.log('Waiting for Minimap...');
        // Increased timeout significantly
        await page.waitForSelector('.minimap-container', { state: 'attached', timeout: 30000 });
        console.log('Minimap container attached.');

        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'verification/minimap_verify.png' });

        console.log('Success!');
    } catch (e) {
        console.error('Error:', e);
        await page.screenshot({ path: 'verification/error_screenshot.png' });
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
