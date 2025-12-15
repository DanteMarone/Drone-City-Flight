
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    // 1. Go to the app
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000); // Wait for load

    // 2. Enable Dev Mode
    await page.evaluate(() => {
        if (window.app && window.app.devMode) {
            window.app.devMode.enable();
        }
    });
    await page.waitForTimeout(500);

    // 3. Create Angry Persons
    await page.evaluate(() => {
        // We'll create multiple angry persons to verify random appearances
        const startX = -10;
        for (let i = 0; i < 4; i++) {
            window.app.devMode.selectObject(null);

            // Create entity params explicitly to simulate different "random" calls
            // Actually, the random logic is in the constructor, so creating new instances is enough.
            const entity = new window.app.EntityRegistry.registry.get('angryPerson')({
                pos: { x: startX + (i * 5), y: 0, z: -10 }
            });

            // Register and Add
            window.app.world.addEntity(entity);
            window.app.colliderSystem.addStatic([entity]);
        }
    });

    await page.waitForTimeout(1000);

    // 4. Select the first one and verify UI properties
    await page.evaluate(() => {
        const angryPersons = window.app.world.colliders.filter(e => e.type === 'angryPerson');
        if (angryPersons.length > 0) {
            // Select the first one
            window.app.devMode.selectObject(angryPersons[0].mesh);
        }
    });

    await page.waitForTimeout(500);

    // 5. Screenshot
    await page.screenshot({ path: 'verification/angry_person_test.png', fullPage: true });

    // 6. Log properties from the page context
    const logs = await page.evaluate(() => {
        const angryPersons = window.app.world.colliders.filter(e => e.type === 'angryPerson');
        const results = angryPersons.map(p => ({
            appearance: p.params.appearance,
            firingRange: p.params.firingRange,
            throwInterval: p.params.throwInterval
        }));

        // Also check if UI input exists
        const uiInterval = document.querySelector('#angry-throw-interval')?.value;
        const uiDist = document.querySelector('#angry-throw-dist')?.value;

        return {
            entities: results,
            uiInterval,
            uiDist
        };
    });

    console.log(JSON.stringify(logs, null, 2));

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
