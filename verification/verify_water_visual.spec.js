
import { test, expect } from '@playwright/test';

test('Verify WaterSystem Visuals', async ({ page }) => {
  // Go to the app
  await page.goto('http://localhost:5173');

  // Wait for canvas
  await page.waitForSelector('canvas');

  // Wait for app to initialize (approx 2s)
  await page.waitForTimeout(2000);

  // Enable Dev Mode to ensure we can see everything and pause game loop logic if needed
  // But WaterSystem runs in Dev Mode too.
  await page.evaluate(() => {
    if (window.app && window.app.devMode) {
      window.app.devMode.enable();
      // Move camera to see the river
      // River spans Z -1000 to 1000.
      // Curve control points: (-100, 0, -1000), (50, 0, 0), (-100, 0, 1000).
      // Let's look at (50, 0, 0) from above/side.
      const camera = window.app.renderer.camera;
      camera.position.set(50, 50, 50);
      camera.lookAt(50, 0, 0);
    }
  });

  // Wait for shader to animate a bit
  await page.waitForTimeout(1000);

  // Take screenshot
  await page.screenshot({ path: 'verification/verification_water.png' });
});
