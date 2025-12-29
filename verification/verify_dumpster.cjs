
const { chromium } = require('playwright');
const path = require('path');

async function verifyDumpster() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // 1. Navigate to the app
        await page.goto('http://localhost:5173');

        // 2. Wait for the loading screen to disappear
        // Assuming there's a loader or just wait for canvas
        await page.waitForSelector('canvas', { timeout: 30000 });

        // Wait a bit for initialization
        await page.waitForTimeout(5000);

        // 3. Enable Dev Mode (Press backtick '`')
        await page.keyboard.press('Backquote');
        await page.waitForTimeout(1000);

        // 4. Evaluate script to clear map and place the Dumpster
        await page.evaluate(() => {
            // Ensure DevMode is active
            if (!window.app.devMode.enabled) {
                window.app.devMode.enable();
            }

            // Clear map to remove distractions
            window.app.devMode.clearMap();

            // Use clipboard hack
            window.app.devMode.clipboard = { type: 'dumpster', params: { color: 0x2e8b57 } }; // Force Green
            window.app.devMode.pasteClipboard();

            // The pasted object should be selected.
            // pasteClipboard usually places it at lookAt point or center.

            setTimeout(() => {
                 const selected = window.app.devMode.selectedObjects[0];
                if (selected) {
                    selected.mesh.position.set(0, 0, -5);
                    selected.mesh.updateMatrixWorld();
                    window.app.colliderSystem.updateBody(selected.mesh); // Update physics

                    // Move camera
                     const cam = window.app.devMode.camera;
                    cam.position.set(3, 3, 3);
                    cam.lookAt(0, 0, -5);
                } else {
                    console.error('Paste failed or no object selected');
                }
            }, 100);
        });

        // 5. Wait for render
        await page.waitForTimeout(2000);

        // 6. Take Screenshot
        const screenshotPath = path.resolve('/home/jules/verification/dumpster_verification.png');
        await page.screenshot({ path: screenshotPath });
        console.log(`Screenshot saved to ${screenshotPath}`);

    } catch (e) {
        console.error('Verification failed:', e);
    } finally {
        await browser.close();
    }
}

verifyDumpster();
