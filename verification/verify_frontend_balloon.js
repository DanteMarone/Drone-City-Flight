
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    // 1. Load the app
    console.log('Navigating to app...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(5000); // Wait for loading

    // 2. Enable Dev Mode
    console.log('Enabling Dev Mode...');
    await page.keyboard.press('Backquote');
    await page.waitForTimeout(1000);

    // 3. Spawning Entity
    console.log('Spawning HotAirBalloonEntity...');
    await page.evaluate(() => {
        const mockMap = {
            objects: [
                {
                    type: 'hotAirBalloon',
                    params: { uuid: 'test-balloon', x: 0, y: 10, z: 20 },
                    position: { x: 0, y: 10, z: 20 },
                    rotation: { x: 0, y: 0, z: 0 },
                    scale: { x: 1, y: 1, z: 1 }
                }
            ],
            rings: [],
            history: []
        };

        window.app.world.loadMap(mockMap);

        // Move camera to look at it
        if (window.app.devMode && window.app.devMode.camera) {
             const cam = window.app.devMode.camera;
             cam.position.set(20, 20, 40);
             cam.lookAt(0, 10, 20);

             // Ensure dev mode thinks it's active so it renders overlays?
             // Actually loadMap resets game, which might disable dev mode or HUD?
             // DevMode is persistent usually.
        }
    });

    await page.waitForTimeout(2000); // Wait for texture generation and render

    // 5. Take screenshot
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'verification/hot_air_balloon.png' });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
