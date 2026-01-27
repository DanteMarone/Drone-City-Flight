
import { strict as assert } from 'assert';
import { CONFIG } from '../config.js';

console.log('\n🔍 Testing: InputManager');

// Setup Mock Window
const listeners = {};
const originalWindow = global.window;

// Mock must be set BEFORE importing InputManager
global.window = {
    addEventListener: (type, fn) => {
        listeners[type] = fn;
    },
    removeEventListener: (type, fn) => {
        if (listeners[type] === fn) delete listeners[type];
    }
};

try {
    // Dynamic import to prevent hoisting issues
    const { InputManager } = await import('./input.js');
    let input;

    // Helper to simulate key events
    const press = (code) => {
        if (listeners.keydown) listeners.keydown({ code });
    };

    const release = (code) => {
        if (listeners.keyup) listeners.keyup({ code });
    };

    // Test 1: Initialization
    {
        input = new InputManager();
        assert.ok(listeners.keydown, 'Should attach keydown listener');
        assert.ok(listeners.keyup, 'Should attach keyup listener');
        console.log('  ✅ should attach event listeners on init');
    }

    // Test 2: Key Mapping
    {
        input = new InputManager();
        press(CONFIG.INPUT.KEYBOARD.FORWARD);
        assert.equal(input.actions.forward, true, 'Forward action should be true');
        release(CONFIG.INPUT.KEYBOARD.FORWARD);
        assert.equal(input.actions.forward, false, 'Forward action should be false');
        console.log('  ✅ should map keys to actions');
    }

    // Test 3: Alternate Keys
    {
        input = new InputManager();
        press(CONFIG.INPUT.KEYBOARD.FORWARD_ALT);
        assert.equal(input.actions.forward, true, 'Forward action should be active with alt key');
        release(CONFIG.INPUT.KEYBOARD.FORWARD_ALT);
        assert.equal(input.actions.forward, false, 'Forward action should be inactive after alt key release');
        console.log('  ✅ should handle alternate keys');
    }

    // Test 4: Movement Vector
    {
        input = new InputManager();
        press(CONFIG.INPUT.KEYBOARD.FORWARD);
        press(CONFIG.INPUT.KEYBOARD.RIGHT);
        const vec = input.getMovementInput();
        assert.equal(vec.z, -1, 'Z should be -1 (Forward)');
        assert.equal(vec.x, 1, 'X should be 1 (Right)');
        assert.equal(vec.y, 0, 'Y should be 0');
        assert.equal(vec.yaw, 0, 'Yaw should be 0');
        console.log('  ✅ should calculate movement vector correctly');
    }

    // Test 5: Vertical & Yaw
    {
        input = new InputManager();
        press(CONFIG.INPUT.KEYBOARD.ASCEND);
        press(CONFIG.INPUT.KEYBOARD.YAW_LEFT);
        const vec = input.getMovementInput();
        assert.equal(vec.y, 1, 'Y should be 1 (Ascend)');
        assert.equal(vec.yaw, 1, 'Yaw should be 1 (Left)');
        console.log('  ✅ should handle yaw and vertical movement');
    }

    // Test 6: One-Shot Events
    {
        input = new InputManager();
        press(CONFIG.INPUT.KEYBOARD.RESET);
        assert.equal(input.events.reset, true, 'Reset event should be triggered');
        input.resetFrame();
        assert.equal(input.events.reset, false, 'Reset event should be cleared after resetFrame');
        console.log('  ✅ should trigger one-shot events');
    }

    // Test 7: Release Keys
    {
        input = new InputManager();
        press(CONFIG.INPUT.KEYBOARD.JUMP);
        assert.equal(input.actions.jump, true);
        release(CONFIG.INPUT.KEYBOARD.JUMP);
        assert.equal(input.actions.jump, false);
        console.log('  ✅ should release keys properly');
    }

    // Test 8: Unmapped Keys
    {
        input = new InputManager();
        press('KeyZ'); // Assume unmapped
        const activeActions = Object.values(input.actions).some(v => v);
        assert.equal(activeActions, false, 'Unmapped key should not trigger actions');
        console.log('  ✅ should ignore unmapped keys');
    }

} catch (e) {
    console.error('❌ Suite failed: InputManager');
    console.error(e);
    process.exit(1);
} finally {
    // Teardown: Restore global window
    if (originalWindow) {
        global.window = originalWindow;
    } else {
        delete global.window;
    }
}
