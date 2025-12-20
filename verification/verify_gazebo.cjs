
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Set a large viewport for better visibility
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
        console.log('Navigating to app...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

        // Wait for app to be ready
        await page.waitForTimeout(5000);

        console.log('Enabling Dev Mode...');
        // Enable Dev Mode via console (as per memory)
        await page.evaluate(() => {
            if (window.app && window.app.devMode) {
                window.app.devMode.enable();
                // Also hide HUD for clearer view
                if (window.app.hud) window.app.hud.setVisible(false);
            }
        });

        // Wait for UI to update
        await page.waitForTimeout(1000);

        console.log('Checking for Gazebo in Palette...');
        // Search for "Gazebo" in the page content
        const gazeboText = await page.getByText('Gazebo', { exact: false }).first();
        if (await gazeboText.isVisible()) {
            console.log('Gazebo found in UI!');
        } else {
            console.log('Gazebo NOT found in UI (might be in a tab or incorrect search).');
        }

        console.log('Loading map with Gazebo...');
        await page.evaluate(() => {
            // Using loadMap to force spawn
            // Need to know structure of EntityRegistry usage in World.
            // But loadMap usually iterates and calls EntityRegistry via factory or type map.
            // If `type: 'gazebo'` is registered, it should work.

            const mapData = {
                objects: [
                    {
                        type: 'gazebo',
                        params: { x: 0, y: 0, z: -10, rotY: 0.5 },
                        position: { x: 0, y: 0, z: -10 },
                        rotation: { x: 0, y: 0.5, z: 0 },
                        scale: { x: 1, y: 1, z: 1 }
                    }
                ],
                rings: [],
                history: []
            };

            // Check if world exists
            if (window.app && window.app.world) {
                window.app.world.loadMap(mapData);
            } else {
                throw new Error('window.app.world is missing');
            }
        });

        // Wait for spawn
        await page.waitForTimeout(2000);

        // Move camera to look at it
        console.log('Moving camera...');
        await page.evaluate(() => {
            const camera = window.app.renderer.camera;
            // Gazebo is at 0, 0, -10.
            // Look from 0, 5, -5 towards -10.
            camera.position.set(0, 5, 0);
            camera.lookAt(0, 1, -10);

            // Ensure sun is up
            window.app.world.timeCycle.timeOfDay = 12; // Noon
            // Force update to apply time cycle immediately
            window.app.world.timeCycle.update(0.1);
        });

        await page.waitForTimeout(1000);

        console.log('Taking screenshot...');
        await page.screenshot({ path: 'verification/gazebo_check.png' });

        // Also take a night screenshot to check light
        console.log('Switching to night...');
        await page.evaluate(() => {
            window.app.world.timeCycle.timeOfDay = 0; // Midnight
            window.app.world.timeCycle.update(0.1);
        });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'verification/gazebo_night_check.png' });

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
})();
