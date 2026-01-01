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

        // Check window.app state
        await page.waitForFunction(() => window.app && window.app.running, { timeout: 10000 }).catch(() => console.log("App not running yet..."));

        const appState = await page.evaluate(() => {
            const app = window.app;
            if (!app) return { exists: false };
            return {
                exists: true,
                hasMinimap: !!app.minimap,
                minimapContainer: !!document.querySelector('.minimap-container'),
                hud: !!app.hud,
                domChildren: document.getElementById('ui-layer')?.children.length,
                uiLayerHTML: document.getElementById('ui-layer')?.innerHTML
            };
        });
        console.log('App State:', JSON.stringify(appState, null, 2));

        if (!appState.hasMinimap) {
            console.error('Minimap instance missing on window.app');
        }

        try {
            await page.waitForSelector('.minimap-container', { state: 'attached', timeout: 5000 });
            console.log('Minimap container attached.');
            await page.screenshot({ path: 'verification/minimap_verify.png' });
            console.log('Success!');
        } catch (e) {
            console.error('Timeout waiting for .minimap-container');
            throw e;
        }

    } catch (e) {
        console.error('Error:', e);
        await page.screenshot({ path: 'verification/error_screenshot.png' });
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
