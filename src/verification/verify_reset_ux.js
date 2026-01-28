
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.route('**/*.{png,jpg,jpeg,glb,fbx}', route => route.abort());

  console.log('Navigating to app...');
  await page.goto('http://localhost:5173');

  console.log('Waiting for app to load...');
  await page.waitForTimeout(5000); // Increased wait

  console.log('Clicking to focus...');
  await page.mouse.click(100, 100);

  console.log('Opening menu...');
  await page.keyboard.press('Escape');

  // Use waitForTimeout instead of waitFor selector if reliable
  await page.waitForTimeout(1000);

  const menu = page.locator('#pause-menu');
  const isVisible = await menu.isVisible();
  console.log('Menu visible:', isVisible);

  if (!isVisible) {
      console.log('Forcing menu show via evaluate...');
      await page.evaluate(() => {
          if (window.app && window.app.menu) {
              window.app.menu.show();
          } else {
              console.error('App or Menu not found on window');
          }
      });
      await page.waitForTimeout(500);
  }

  // Locate Reset Button
  const resetBtn = page.locator('#btn-reset');
  console.log('Clicking reset button once...');
  await resetBtn.click();

  await page.waitForTimeout(500);

  // Verify text
  const text = await resetBtn.textContent();
  console.log('Button text:', text);

  if (text.includes('CONFIRM RESET')) {
      console.log('SUCCESS: Confirmation text found.');
  } else {
      console.error('FAILURE: Confirmation text NOT found. Got: ' + text);
  }

  // Take screenshot
  console.log('Taking screenshot...');
  await page.screenshot({ path: 'verification_reset.png' });

  await browser.close();
})();
