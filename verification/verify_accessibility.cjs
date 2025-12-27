const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    // Launch browser
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Go to localhost (assuming port 5173 for Vite default)
        // Adjust port if necessary based on project config or output
        await page.goto('http://localhost:5173');

        // Wait for game to load (canvas element)
        await page.waitForSelector('canvas');

        // --- Verify Main Menu Accessibility ---
        // The menu is initially hidden. We need to trigger it or just inspect DOM.
        // Actually, the menu is created in DOM on init but hidden.

        // Wait for Menu System to be ready
        await page.waitForSelector('#pause-menu', { state: 'attached' });

        // Verify icons have aria-hidden="true"
        const hiddenIcons = await page.locator('.menu-icon[aria-hidden="true"]').count();
        console.log(`Found ${hiddenIcons} icons with aria-hidden="true"`);

        if (hiddenIcons < 4) {
             throw new Error("Failed to find aria-hidden on menu icons");
        }

        // --- Verify Dev Mode Palette Accessibility ---
        // Enable Dev Mode to see the UI
        await page.evaluate(() => {
            window.app.devMode.enable();
        });

        // Wait for Dev UI
        await page.waitForSelector('#dev-ui', { state: 'visible' });

        // Wait for Palette Items to be populated
        // The palette items are generated async? No, synchronous in _buildPalette.
        await page.waitForSelector('.palette-item');

        // Check if palette items are <button>
        const buttonItems = await page.locator('.palette-item').count();
        console.log(`Found ${buttonItems} palette items`);

        // Verify tag name of first item
        const firstItemTagName = await page.evaluate(() => {
            return document.querySelector('.palette-item').tagName;
        });
        console.log(`Palette item tag name: ${firstItemTagName}`);

        if (firstItemTagName !== 'BUTTON') {
            throw new Error(`Expected palette item to be BUTTON, got ${firstItemTagName}`);
        }

        // Take screenshot of Dev Mode
        await page.screenshot({ path: 'verification/dev_mode_accessibility.png' });
        console.log('Screenshot saved to verification/dev_mode_accessibility.png');

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
        process.exit(0);
    }
})();
