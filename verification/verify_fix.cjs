const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
      headless: true,
      args: ['--enable-unsafe-swiftshader']
  });
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1280, height: 720 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:5173', { timeout: 60000 });

    console.log('Waiting for window.app...');
    await page.waitForFunction(() => typeof window.app !== 'undefined', null, { timeout: 30000 });

    console.log('Enabling Dev Mode...');
    await page.evaluate(() => {
        window.app.devMode.enable();
    });

    // Wait for UI
    await page.waitForSelector('#dev-ui', { state: 'visible', timeout: 10000 });

    // The logs showed "Props (1) Sky Garden Tower". We have at least one object.
    // We need to create another one to test multi-selection.
    // We can use the clipboard or history to paste? Or just use the palette.

    console.log('Creating second object via Palette...');
    // Click on "House" button in palette.
    // It is in the "Residential" tab usually, or "All".
    // The button has aria-label or text.
    // The previous logs showed buttons like "Shop", "House".

    // Wait for palette
    await page.waitForSelector('.dev-asset-btn', { timeout: 5000 });

    // Find a button with text "House" or "Shop"
    const houseBtn = page.locator('.dev-asset-btn').filter({ hasText: 'House' }).first();
    if (await houseBtn.count() > 0) {
        console.log('Found House button. Clicking...');
        await houseBtn.click();

        // Clicking usually sets placement mode. We need to click in the world.
        // Or drag and drop.
        // Let's try simulating drag and drop? That's hard.
        // Let's try clicking in the canvas center.
        console.log('Clicking on canvas to place...');
        await page.mouse.click(600, 300);
        await page.waitForTimeout(1000);
    } else {
        console.log('House button not found. Listing buttons...');
        const texts = await page.locator('.dev-asset-btn').allInnerTexts();
        console.log(texts.slice(0, 10));
    }

    console.log('Selecting objects...');
    const result = await page.evaluate(() => {
        const objects = window.app.world.colliders.filter(o => o.userData && o.userData.uuid);
        console.log(`World has ${objects.length} colliders.`);

        if (objects.length < 2) return false;

        const toSelect = objects.slice(0, 2); // Select 2
        window.app.devMode.selectObjects(toSelect);
        return true;
    });

    if (!result) {
         console.error('Still not enough objects.');
         // Try to duplicate the existing object if possible?
         // window.app.devMode.duplicateSelected()?
         // Let's assume there is at least one "Sky Garden Tower".
         // We can use selectObjects to select it, then duplicate.
         await page.evaluate(() => {
             const objects = window.app.world.colliders;
             if (objects.length > 0) {
                 window.app.devMode.selectObjects([objects[0]]);
                 window.app.devMode.copySelected();
                 window.app.devMode.pasteClipboard(); // Pastes at 0,0,0 usually or offset
             }
         });
         await page.waitForTimeout(1000);

         // Try selecting again
         const retry = await page.evaluate(() => {
            const objects = window.app.world.colliders.filter(o => o.userData && o.userData.uuid);
            if (objects.length < 2) return false;
            window.app.devMode.selectObjects(objects.slice(0, 2));
            return true;
         });

         if (!retry) throw new Error('Failed to create second object.');
    }

    console.log('Waiting for Inspector update...');
    await page.waitForTimeout(2000);

    const inspectorContent = await page.content();
    const hasGroupTransform = inspectorContent.includes('Transform (Group)');

    if (hasGroupTransform) {
        console.log('SUCCESS: "Transform (Group)" found in Inspector.');
    } else {
        console.error('FAILURE: "Transform (Group)" NOT found.');
        const textContent = await page.$eval('.dev-inspector-content', el => el.innerText);
        console.log('Inspector Content:', textContent);
    }

    const screenshotPath = path.resolve(__dirname, 'verification_fix.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to ${screenshotPath}`);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
