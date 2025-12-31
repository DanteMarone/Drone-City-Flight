
import { test, expect, chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log("Navigating to http://localhost:5173");
    await page.goto('http://localhost:5173');

    console.log("Waiting for canvas...");
    await page.waitForSelector('canvas', { timeout: 30000 });

    console.log("Waiting for app initialization...");
    await page.waitForTimeout(5000);

    console.log("Injecting map data...");
    await page.evaluate(() => {
        if (!window.app) throw new Error("App not found");

        // window.app.camera might be initialized later or inside app.init()
        // Let's check where the camera is.
        // Usually app.camera or app.renderer.camera

        // If app.camera is missing, check app.drone.camera or similar?
        // But App.js usually sets this.camera.

        // If it's undefined, maybe wait loop?
        // But let's assume if it's missing we can't do much.

        // Let's print keys of app to debug
        console.log("App keys:", Object.keys(window.app));

        // Try enabling dev mode first, it might init camera
        window.app.devMode.enable();

        const cam = window.app.camera || (window.app.renderer ? window.app.renderer.camera : null);

        if (!cam) {
             throw new Error("Camera still not found on window.app or window.app.renderer");
        }

        const mapData = {
            objects: [
                {
                    type: 'hedge',
                    uuid: 'verify-hedge-1',
                    transform: { pos: [10, 0, 10], rot: [0, 0, 0], scale: [1, 1, 1] },
                    params: { width: 2, height: 1.5, depth: 1 }
                }
            ],
            rings: [],
            history: []
        };

        console.log("Loading map...");
        window.app.world.loadMap(mapData);

        // Force camera position
        cam.position.set(10, 5, 20);
        cam.lookAt(10, 0, 10);
        cam.updateMatrixWorld(true);

        // Also ensure sunlight is adequate
        if (window.app.world.timeCycle) {
            window.app.world.timeCycle.timeOfDay = 12; // Noon
        }
    });

    console.log("Waiting for render...");
    await page.waitForTimeout(2000);

    console.log("Taking screenshot...");
    await page.screenshot({ path: 'verification/verify_hedge.png' });
    console.log("Screenshot saved to verification/verify_hedge.png");

  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
