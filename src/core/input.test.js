import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';

describe('InputManager', () => {
    let InputManager;
    let windowSpy = {};

    before(async () => {
        // Setup JSDOM environment
        const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost/'
        });

        // Mock global window and document
        global.window = dom.window;
        global.document = dom.window.document;
        global.KeyboardEvent = dom.window.KeyboardEvent;

        // Import the module under test
        // We do this inside before to ensure globals are set
        const module = await import('./input.js');
        InputManager = module.InputManager;
    });

    after(() => {
        // Cleanup global scope
        delete global.window;
        delete global.document;
        delete global.KeyboardEvent;
    });

    describe('Initialization', () => {
        test('should initialize with default state', () => {
            const input = new InputManager();
            assert.deepStrictEqual(input.keys, {});
            assert.strictEqual(input.actions.ascend, false);
            assert.strictEqual(input.events.reset, false);
        });
    });

    describe('Key Mapping', () => {
        let input;

        beforeEach(() => {
            input = new InputManager();
        });

        test('should map keys to actions', () => {
            // Simulate KeyDown for 'KeyW' (Ascend)
            const event = new window.KeyboardEvent('keydown', { code: 'KeyW' });
            window.dispatchEvent(event);

            assert.strictEqual(input.keys['KeyW'], true, 'Key state should be true');
            assert.strictEqual(input.actions.ascend, true, 'Action ascend should be true');

            // Simulate KeyUp
            const upEvent = new window.KeyboardEvent('keyup', { code: 'KeyW' });
            window.dispatchEvent(upEvent);

            assert.strictEqual(input.keys['KeyW'], false, 'Key state should be false');
            assert.strictEqual(input.actions.ascend, false, 'Action ascend should be false');
        });

        test('should handle alternate keys', () => {
            // Forward can be ArrowUp or KeyI (FORWARD_ALT)
            // Test ArrowUp
            window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'ArrowUp' }));
            assert.strictEqual(input.actions.forward, true, 'ArrowUp should trigger forward');
            window.dispatchEvent(new window.KeyboardEvent('keyup', { code: 'ArrowUp' }));

            // Test KeyI
            window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'KeyI' }));
            assert.strictEqual(input.actions.forward, true, 'KeyI should trigger forward');
        });
    });

    describe('Movement Vector', () => {
        let input;

        beforeEach(() => {
            input = new InputManager();
        });

        test('should calculate neutral vector when no keys pressed', () => {
            const move = input.getMovementInput();
            assert.deepStrictEqual(move, { x: 0, y: 0, z: 0, yaw: 0 });
        });

        test('should calculate forward movement (negative Z)', () => {
            window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'ArrowUp' }));
            const move = input.getMovementInput();
            assert.strictEqual(move.z, -1);
        });

        test('should cancel opposing inputs', () => {
            // Press Left and Right
            window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'ArrowLeft' }));
            window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'ArrowRight' }));

            const move = input.getMovementInput();
            assert.strictEqual(move.x, 0, 'Left and Right should cancel out');
        });

        test('should combine orthogonal inputs', () => {
            // Forward and Right
            window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'ArrowUp' }));
            window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'ArrowRight' }));

            const move = input.getMovementInput();
            assert.strictEqual(move.z, -1);
            assert.strictEqual(move.x, 1);
        });
    });

    describe('One-Shot Events', () => {
        let input;

        beforeEach(() => {
            input = new InputManager();
        });

        test('should trigger reset event', () => {
            window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'KeyR' }));
            const events = input.getEvents();
            assert.strictEqual(events.reset, true);
        });

        test('should clear events on resetFrame', () => {
            window.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'KeyR' }));
            assert.strictEqual(input.events.reset, true);

            input.resetFrame();
            assert.strictEqual(input.events.reset, false);
        });

        test('should only trigger event on keydown', () => {
             // KeyUp shouldn't trigger event again or toggle it
             input.resetFrame();
             window.dispatchEvent(new window.KeyboardEvent('keyup', { code: 'KeyR' }));
             assert.strictEqual(input.events.reset, false);
        });
    });
});
