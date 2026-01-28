
import { test } from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';
import { MenuSystem } from './menu.js';

// Setup basic JSDOM environment
const dom = new JSDOM(`
<!DOCTYPE html>
<body>
    <div id="ui-layer"></div>
</body>
`);
global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);

test('MenuSystem Reset Button Confirmation', async (t) => {
    // Mock App
    const mockApp = {
        _resetGame: () => { mockApp.resetCalled = true; },
        resetCalled: false,
        paused: false,
        cameraController: {},
        post: {},
        input: { sensitivity: 0.001 }
    };

    const menu = new MenuSystem(mockApp);
    const resetBtn = menu.dom.reset;

    await t.test('Initial state', () => {
        assert.ok(!resetBtn.classList.contains('btn-danger-confirm'), 'Should not have danger class initially');
        assert.ok(resetBtn.textContent.includes('RESET DRONE'), 'Should have default text');
    });

    await t.test('First Click - Confirmation State', () => {
        resetBtn.click();
        assert.ok(resetBtn.classList.contains('btn-danger-confirm'), 'Should have danger class after click');
        assert.ok(resetBtn.textContent.includes('CONFIRM RESET'), 'Should show confirmation text');
        assert.strictEqual(mockApp.resetCalled, false, 'Should NOT have called reset yet');
    });

    await t.test('Second Click - Execution', () => {
        resetBtn.click();
        assert.strictEqual(mockApp.resetCalled, true, 'Should call reset on second click');
        // It hides menu, but we want to check if button reset
        assert.ok(!resetBtn.classList.contains('btn-danger-confirm'), 'Should revert class after reset');
        assert.ok(resetBtn.textContent.includes('RESET DRONE'), 'Should revert text after reset');
    });

    await t.test('Reversion on Blur', async () => {
        // Reset state manually to test blur from clean slate
        mockApp.resetCalled = false;

        // Click once to activate
        resetBtn.click();
        assert.ok(resetBtn.classList.contains('btn-danger-confirm'), 'Should be active');

        // Trigger blur - JSDOM might not fire handler automatically via method if not focused/connected properly,
        // so we explicitly dispatch the event to be safe.
        resetBtn.dispatchEvent(new window.Event('blur'));

        assert.ok(!resetBtn.classList.contains('btn-danger-confirm'), 'Should revert on blur');
        assert.ok(resetBtn.textContent.includes('RESET DRONE'), 'Should revert text on blur');
    });
});
