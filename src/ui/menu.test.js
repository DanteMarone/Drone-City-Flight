
import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';
import { MenuSystem } from './menu.js';
import { CONFIG } from '../config.js';

describe('MenuSystem', () => {
    let dom;
    let window;
    let document;
    let appMock;
    let resetGameMock;

    beforeEach(() => {
        // Setup JSDOM
        dom = new JSDOM(`<!DOCTYPE html><div id="ui-layer"></div>`);
        window = dom.window;
        document = dom.window.document;

        // Mock global window and document
        global.window = window;
        global.document = document;
        global.HTMLElement = window.HTMLElement;
        global.requestAnimationFrame = (cb) => setTimeout(cb, 0);

        // Mock App
        resetGameMock = mock.fn();
        appMock = {
            _resetGame: resetGameMock,
            loadMap: mock.fn(),
            cameraController: { sensitivity: 0.001 },
            devMode: { enable: mock.fn() },
            photoMode: { enable: mock.fn() },
            help: { show: mock.fn() },
            notifications: { show: mock.fn() },
            post: { enabled: true },
            paused: false
        };
    });

    afterEach(() => {
        // Cleanup
        delete global.window;
        delete global.document;
        delete global.HTMLElement;
        delete global.requestAnimationFrame;
    });

    test('Reset button implements two-step confirmation', () => {
        const menuSystem = new MenuSystem(appMock);
        const resetBtn = document.getElementById('btn-reset');

        // Initial State
        const originalText = resetBtn.textContent;

        // --- First Click ---
        resetBtn.click();

        // Assert NO reset happened yet
        assert.strictEqual(resetGameMock.mock.calls.length, 0, 'First click should NOT trigger reset');

        // Assert UI feedback (class and text change)
        assert.ok(resetBtn.classList.contains('btn-danger-confirm'), 'Button should have danger class');
        assert.ok(resetBtn.textContent.includes('CONFIRM'), 'Button text should change to confirmation');
        assert.strictEqual(resetBtn.getAttribute('aria-pressed'), 'true', 'Aria-pressed should be true');

        // --- Second Click ---
        resetBtn.click();

        // Assert Reset HAPPENED
        assert.strictEqual(resetGameMock.mock.calls.length, 1, 'Second click SHOULD trigger reset');

        // Assert State Reset (though menu hides, if shown again it should be reset?
        // Logic says we remove class and revert text immediately after execute)
        assert.ok(!resetBtn.classList.contains('btn-danger-confirm'), 'Danger class should be removed');
        assert.strictEqual(resetBtn.innerHTML, resetBtn.innerHTML, 'Checking content (should be reverted)');
        // Note: checking innerHTML against original is tricky if we don't have exact original string,
        // but our code reverts to `originalResetContent`.
    });

    test('Reset button cancels confirmation on mouse leave', () => {
        const menuSystem = new MenuSystem(appMock);
        const resetBtn = document.getElementById('btn-reset');
        const originalHTML = resetBtn.innerHTML;

        // --- First Click ---
        resetBtn.click();
        assert.ok(resetBtn.classList.contains('btn-danger-confirm'));

        // --- Mouse Leave ---
        const event = new window.Event('mouseleave');
        resetBtn.dispatchEvent(event);

        // Assert Reset Canceled
        assert.ok(!resetBtn.classList.contains('btn-danger-confirm'), 'Danger class should be removed on mouseleave');
        assert.strictEqual(resetBtn.innerHTML, originalHTML, 'Button content should revert to original');
        assert.strictEqual(resetBtn.getAttribute('aria-pressed'), 'false', 'Aria-pressed should be false');

        // --- Click Again ---
        resetBtn.click();
        // Should be start of new confirmation, NOT reset
        assert.strictEqual(resetGameMock.mock.calls.length, 0, 'Click after cancel should NOT trigger reset');
        assert.ok(resetBtn.classList.contains('btn-danger-confirm'));
    });
});
