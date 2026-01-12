const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Go to app
    await page.goto('http://localhost:5173');

    // Enable Dev Mode (Backquote)
    await page.keyboard.press('Backquote');

    // Wait for Dev UI
    await page.waitForSelector('#dev-ui');

    // Locate the Outliner Group Header (Infrastructure)
    // The class is 'dev-outliner-group-header'
    // We expect it to have tabindex="0" and role="button" now.

    // Find Infrastructure header. Text might be "Infrastructure (X)"
    // We use a looser text match
    const infraHeader = page.locator('.dev-outliner-group-header').first();
    await infraHeader.waitFor();

    // Verify Attributes
    const role = await infraHeader.getAttribute('role');
    const tabIndex = await infraHeader.getAttribute('tabindex');

    console.log(`Role: ${role}, TabIndex: ${tabIndex}`);

    if (role !== 'button' || tabIndex !== '0') {
        console.error('FAILED: Accessibility attributes missing');
        process.exit(1);
    }

    // Test Interaction: Press Space to Collapse/Expand
    // First, check if expanded (default)
    // The parent .dev-outliner-group should NOT have .collapsed class
    let group = page.locator('.dev-outliner-group').first();
    let cls = await group.getAttribute('class');
    if (cls.includes('collapsed')) {
        console.error('FAILED: Initial state should be expanded');
        process.exit(1);
    }

    // Focus and Press Space
    await infraHeader.focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(100); // Wait for DOM update

    // Check if collapsed
    cls = await group.getAttribute('class');
    if (!cls.includes('collapsed')) {
        console.error('FAILED: Did not collapse on Space key');
        process.exit(1);
    }

    // Take screenshot
    await page.screenshot({ path: '/app/verification/outliner_a11y.png' });
    console.log('Verification Passed');

    await browser.close();
})();
