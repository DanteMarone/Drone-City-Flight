import { JSDOM } from 'jsdom';
import { strict as assert } from 'assert';

// -----------------------------------------------------------------------------
// Mock Browser Environment
// -----------------------------------------------------------------------------
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: "http://localhost/"
});
global.window = dom.window;
global.document = dom.window.document;
// global.navigator is read-only in some node envs, and not needed for InputManager

// Import target module after mocking window
import { InputManager } from './input.js';

// -----------------------------------------------------------------------------
// Test Helpers
// -----------------------------------------------------------------------------
function describe(name, fn) {
    console.log(`\n🔍 Testing: ${name}`);
    try {
        fn();
    } catch (e) {
        console.error(`❌ Suite failed: ${name}`);
        console.error(e);
        process.exit(1);
    }
}

function it(name, fn) {
    try {
        fn();
        console.log(`  ✅ ${name}`);
    } catch (e) {
        console.error(`  ❌ ${name}`);
        console.error(e);
        throw e;
    }
}

// -----------------------------------------------------------------------------
// Suite: InputManager
// -----------------------------------------------------------------------------
describe('InputManager', () => {
    let input;

    // Helper to simulate key events
    function dispatchKey(type, code) {
        const event = new dom.window.KeyboardEvent(type, { code });
        dom.window.dispatchEvent(event);
    }

    // Since InputManager attaches listeners to window and lacks a cleanup method,
    // we must accept that previous instances will still receive events.
    // We create a new instance for each test to ensure clean internal state.

    it('should initialize with default state', () => {
        input = new InputManager();
        assert.deepEqual(input.keys, {}, 'Keys should be empty');
        assert.equal(input.actions.forward, false, 'Actions should be false');
    });

    it('should map KeyDown to actions', () => {
        input = new InputManager();
        // ASCEND is 'KeyW' in config
        dispatchKey('keydown', 'KeyW');

        assert.equal(input.keys['KeyW'], true, 'KeyW should be pressed');
        assert.equal(input.actions.ascend, true, 'Ascend action should be active');
    });

    it('should map KeyUp to actions', () => {
        input = new InputManager();
        dispatchKey('keydown', 'KeyW');
        assert.equal(input.actions.ascend, true);

        dispatchKey('keyup', 'KeyW');
        assert.equal(input.keys['KeyW'], false, 'KeyW should be released');
        assert.equal(input.actions.ascend, false, 'Ascend action should be inactive');
    });

    it('should handle alternative bindings', () => {
        input = new InputManager();
        // FORWARD is 'ArrowUp', FORWARD_ALT is 'KeyI'
        dispatchKey('keydown', 'KeyI');
        assert.equal(input.actions.forward, true, 'Forward action should trigger on Alt key');

        dispatchKey('keyup', 'KeyI');
        assert.equal(input.actions.forward, false, 'Forward action should release on Alt key');
    });

    it('should calculate movement input vector', () => {
        input = new InputManager();

        // Forward (Z-1) and Right (X+1)
        dispatchKey('keydown', 'ArrowUp');   // Forward
        dispatchKey('keydown', 'ArrowRight');// Right

        const move = input.getMovementInput();
        assert.equal(move.x, 1, 'X should be 1 (Right)');
        assert.equal(move.z, -1, 'Z should be -1 (Forward)');
        assert.equal(move.y, 0, 'Y should be 0');

        // Add Ascend (Y+1)
        dispatchKey('keydown', 'KeyW');
        const move2 = input.getMovementInput();
        assert.equal(move2.y, 1, 'Y should be 1 (Ascend)');
    });

    it('should capture and reset one-shot events', () => {
        input = new InputManager();
        // TOGGLE_CAMERA is 'KeyC'

        assert.equal(input.events.toggleCamera, false);

        dispatchKey('keydown', 'KeyC');
        assert.equal(input.events.toggleCamera, true, 'Event should be triggered');

        // Should persist until resetFrame is called
        assert.equal(input.events.toggleCamera, true);

        input.resetFrame();
        assert.equal(input.events.toggleCamera, false, 'Event should be cleared after resetFrame');
    });
});
