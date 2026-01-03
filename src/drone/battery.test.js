
import { strict as assert } from 'assert';
import { BatteryManager } from './battery.js';
import { CONFIG } from '../config.js';

// Mock THREE.Vector3 behavior for velocity
class MockVector3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    length() {
        return Math.sqrt(this.x**2 + this.y**2 + this.z**2);
    }
}

// Test Helper (Minimalist, similar to test_physics.js)
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

// Mock window.app
function setupMockApp(worldDrain) {
    global.window = {
        app: {
            world: {
                batteryDrain: worldDrain
            }
        }
    };
}

function teardownMockApp() {
    delete global.window;
}

describe('BatteryManager', () => {

    it('should initialize with max battery', () => {
        const battery = new BatteryManager();
        assert.equal(battery.current, CONFIG.BATTERY.MAX);
        assert.equal(battery.max, CONFIG.BATTERY.MAX);
        assert.equal(battery.depleted, false);
    });

    it('should drain battery when moving', () => {
        const battery = new BatteryManager();
        const initial = battery.current;
        const dt = 1.0; // 1 second
        const velocity = new MockVector3(10, 0, 0); // Speed 10

        setupMockApp(undefined); // No world override
        battery.update(dt, velocity, {});
        teardownMockApp();

        const expectedDrain = CONFIG.BATTERY.DRAIN_RATE * dt;
        assert.equal(battery.current, initial - expectedDrain);
    });

    it('should NOT drain battery when hovering (speed < 0.1)', () => {
        const battery = new BatteryManager();
        const initial = battery.current;
        const dt = 1.0;
        const velocity = new MockVector3(0.05, 0, 0); // Speed 0.05

        setupMockApp(undefined);
        battery.update(dt, velocity, {});
        teardownMockApp();

        assert.equal(battery.current, initial, 'Battery should not drain when hovering');
    });

    it('should respect World drain rate override', () => {
        const battery = new BatteryManager();
        const initial = battery.current;
        const dt = 1.0;
        const velocity = new MockVector3(10, 0, 0);
        const overrideRate = 50.0;

        setupMockApp(overrideRate);
        battery.update(dt, velocity, {});
        teardownMockApp();

        assert.equal(battery.current, initial - overrideRate);
    });

    it('should handle depletion', () => {
        const battery = new BatteryManager();
        battery.current = 1.0;
        const dt = 1.0;
        const velocity = new MockVector3(10, 0, 0);

        // Drain rate is default 2.0, so 1.0 - 2.0 = -1.0
        setupMockApp(undefined);
        battery.update(dt, velocity, {});
        teardownMockApp();

        assert.equal(battery.current, 0, 'Battery should clamp to 0');
        assert.equal(battery.depleted, true, 'Battery should be depleted');
    });

    it('should not update if already depleted', () => {
        const battery = new BatteryManager();
        battery.current = 0;
        battery.depleted = true;

        setupMockApp(undefined);
        battery.update(1.0, new MockVector3(10, 0, 0), {});
        teardownMockApp();

        assert.equal(battery.current, 0);
    });

    it('should recharge via add()', () => {
        const battery = new BatteryManager();
        battery.current = 50;

        battery.add(10);
        assert.equal(battery.current, 60);

        battery.add(1000); // Overflow
        assert.equal(battery.current, CONFIG.BATTERY.MAX, 'Should clamp to max');
    });

    it('should clear depleted flag when recharged', () => {
        const battery = new BatteryManager();
        battery.current = 0;
        battery.depleted = true;

        battery.add(10);
        assert.equal(battery.current, 10);
        assert.equal(battery.depleted, false, 'Depleted flag should be cleared');
    });

    it('should reset to max', () => {
        const battery = new BatteryManager();
        battery.current = 10;
        battery.depleted = true;

        battery.reset();
        assert.equal(battery.current, CONFIG.BATTERY.MAX);
        assert.equal(battery.depleted, false);
    });
});
