const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto('http://localhost:4173/');

        // Wait for game to load
        await page.waitForTimeout(2000);

        // Locate the pause button
        const pauseBtn = page.getByLabel('Pause Game');

        // Assert it exists and is visible
        if (await pauseBtn.isVisible()) {
            console.log('Pause button is visible.');
        } else {
            console.error('Pause button NOT visible.');
        }

        // Click it to open menu
        await pauseBtn.click();

        // Wait for menu animation
        await page.waitForTimeout(1000);

        // Check if menu is visible
        const menuTitle = page.getByRole('heading', { name: 'PAUSED' });
        if (await menuTitle.isVisible()) {
            console.log('Menu opened successfully.');
        } else {
             console.error('Menu did NOT open.');
        }

        // Take screenshot
        await page.screenshot({ path: path.resolve(__dirname, 'verification_pause.png') });
        console.log('Screenshot saved.');

    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        await browser.close();
    }
})();
