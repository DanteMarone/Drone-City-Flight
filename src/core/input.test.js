import { strict as assert } from 'assert';
import { InputManager } from './input.js';
import { CONFIG } from '../config.js';

// Test Runner Helpers
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

// Mock Window
let listeners = {};
function setupMockWindow() {
    listeners = {};
    global.window = {
        addEventListener: (event, fn) => {
            listeners[event] = fn;
        },
        removeEventListener: (event, fn) => {
            if (listeners[event] === fn) delete listeners[event];
        }
    };
}

function teardownMockWindow() {
    delete global.window;
    listeners = {};
}

function triggerKey(type, code) {
    if (listeners[type]) {
        listeners[type]({ code });
    }
}

describe('InputManager', () => {
    const K = CONFIG.INPUT.KEYBOARD;

    it('should initialize and register listeners', () => {
        setupMockWindow();
        const input = new InputManager();
        assert.ok(listeners['keydown'], 'Should register keydown');
        assert.ok(listeners['keyup'], 'Should register keyup');
        teardownMockWindow();
    });

    it('should track key states', () => {
        setupMockWindow();
        const input = new InputManager();

        triggerKey('keydown', K.FORWARD);
        assert.equal(input.keys[K.FORWARD], true);

        triggerKey('keyup', K.FORWARD);
        assert.equal(input.keys[K.FORWARD], false);
        teardownMockWindow();
    });

    it('should map keys to actions', () => {
        setupMockWindow();
        const input = new InputManager();

        // Test FORWARD
        triggerKey('keydown', K.FORWARD);
        assert.equal(input.actions.forward, true);
        triggerKey('keyup', K.FORWARD);
        assert.equal(input.actions.forward, false);

        // Test JUMP
        triggerKey('keydown', K.JUMP);
        assert.equal(input.actions.jump, true);
        teardownMockWindow();
    });

    it('should handle alternate keys', () => {
        setupMockWindow();
        const input = new InputManager();

        // Primary FORWARD
        triggerKey('keydown', K.FORWARD);
        assert.equal(input.actions.forward, true);
        triggerKey('keyup', K.FORWARD);
        assert.equal(input.actions.forward, false);

        // Alternate FORWARD_ALT
        triggerKey('keydown', K.FORWARD_ALT);
        assert.equal(input.actions.forward, true);
        teardownMockWindow();
    });

    it('should calculate movement vector', () => {
        setupMockWindow();
        const input = new InputManager();

        // Forward
        triggerKey('keydown', K.FORWARD);
        let vec = input.getMovementInput();
        assert.equal(vec.z, -1, 'Forward should be z=-1');

        // Forward + Right
        triggerKey('keydown', K.RIGHT);
        vec = input.getMovementInput();
        assert.equal(vec.z, -1);
        assert.equal(vec.x, 1);

        // Cancel out (Left + Right)
        triggerKey('keydown', K.LEFT);
        vec = input.getMovementInput();
        assert.equal(vec.x, 0, 'Left + Right should cancel x');

        teardownMockWindow();
    });

    it('should handle one-shot events', () => {
        setupMockWindow();
        const input = new InputManager();

        triggerKey('keydown', K.TOGGLE_CAMERA);
        assert.equal(input.events.toggleCamera, true);

        // Reset frame
        input.resetFrame();
        assert.equal(input.events.toggleCamera, false, 'Should be cleared after resetFrame');
        teardownMockWindow();
    });

    it('should ignore unknown keys', () => {
        setupMockWindow();
        const input = new InputManager();

        triggerKey('keydown', 'KeyUnknown');
        assert.equal(input.keys['KeyUnknown'], true); // It tracks it

        // But affects no actions
        const actions = Object.values(input.actions);
        assert.ok(actions.every(val => val === false), 'Unknown key should not trigger actions');
        teardownMockWindow();
    });
});
