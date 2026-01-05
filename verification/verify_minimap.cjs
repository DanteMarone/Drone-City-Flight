
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the local dev server
    await page.goto('http://localhost:5173/');

    // Wait for the game to load (canvas element visible)
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Wait for the HUD to initialize and Minimap to appear
    // The minimap has class 'minimap-container'
    await page.waitForSelector('.minimap-container', { state: 'visible', timeout: 5000 });

    // Wait a bit for the minimap to render content
    await page.waitForTimeout(2000);

    // Take a screenshot of the entire page
    await page.screenshot({ path: 'verification/minimap_full.png' });

    // Take a screenshot of just the minimap
    const minimap = await page.$('.minimap-container');
    if (minimap) {
        await minimap.screenshot({ path: 'verification/minimap_widget.png' });
    }

    console.log('Screenshots taken successfully.');

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await browser.close();
  }
})();
