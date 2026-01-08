
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Navigate to app
  try {
    // Reduced wait condition to 'domcontentloaded' to avoid network idle timeout issues
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (e) {
    console.error('Failed to load page:', e);
    await browser.close();
    process.exit(1);
  }

  // Enable Dev Mode
  await page.evaluate(() => {
    // Wait for app to be ready
    return new Promise(resolve => {
        const check = () => {
            if (window.app && window.app.devMode) {
                window.app.devMode.enable();
                resolve();
            } else {
                setTimeout(check, 100);
            }
        };
        check();
    });
  });

  // Wait for Dev UI
  await page.waitForSelector('.dev-top-bar');

  // Find and click the 'Dev Mode' menu button
  const menuBtn = page.locator('.dev-menu-btn', { hasText: 'Dev Mode' });
  await menuBtn.click();

  // Wait for dropdown to appear
  const dropdown = page.locator('.dev-dropdown[role="menu"][aria-label="Dev Mode"]');
  await dropdown.waitFor({ state: 'visible' });

  // Force focus to simulate keyboard interaction
  await page.keyboard.press('ArrowDown');

  // Take screenshot
  const screenshotPath = path.join(process.cwd(), 'verification', 'ux_menu_screenshot.png');
  await page.screenshot({ path: screenshotPath });

  console.log(`Screenshot saved to ${screenshotPath}`);

  await browser.close();
})();
