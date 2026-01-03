
import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as assert } from 'assert';
import { BatteryManager } from '../drone/battery.js';
import { CONFIG } from '../config.js';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// Test Helpers
// -----------------------------------------------------------------------------

function setupGlobalMock() {
    global.window = {
        app: {
            world: {
                batteryDrain: undefined // Default: undefined
            }
        }
    };
}

function teardownGlobalMock() {
    delete global.window;
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('BatteryManager', () => {

    let battery;

    beforeEach(() => {
        setupGlobalMock();
        battery = new BatteryManager();
    });

    afterEach(() => {
        teardownGlobalMock();
    });

    describe('Initialization', () => {
        it('should start with max charge', () => {
            assert.equal(battery.current, CONFIG.BATTERY.MAX);
            assert.equal(battery.max, CONFIG.BATTERY.MAX);
            assert.equal(battery.depleted, false);
        });
    });

    describe('Drain Logic', () => {
        it('should NOT drain when stationary (speed <= 0.1)', () => {
            const dt = 1.0;
            const velocity = new THREE.Vector3(0, 0, 0); // Speed 0

            battery.update(dt, velocity);

            assert.equal(battery.current, CONFIG.BATTERY.MAX, 'Should remain at max charge');
        });

        it('should NOT drain when hovering slowly (speed <= 0.1)', () => {
            const dt = 1.0;
            const velocity = new THREE.Vector3(0, 0.1, 0); // Speed 0.1 (Threshold)

            battery.update(dt, velocity);

            assert.equal(battery.current, CONFIG.BATTERY.MAX, 'Should remain at max charge');
        });

        it('should drain when moving (speed > 0.1)', () => {
            const dt = 1.0;
            const velocity = new THREE.Vector3(10, 0, 0); // High speed
            const expectedDrain = CONFIG.BATTERY.DRAIN_RATE * dt;

            battery.update(dt, velocity);

            assert.equal(battery.current, CONFIG.BATTERY.MAX - expectedDrain, 'Should drain at default rate');
        });

        it('should use World override for drain rate', () => {
            const dt = 1.0;
            const velocity = new THREE.Vector3(10, 0, 0);
            const overrideRate = 50.0;

            // Set override
            window.app.world.batteryDrain = overrideRate;

            battery.update(dt, velocity);

            assert.equal(battery.current, CONFIG.BATTERY.MAX - overrideRate, 'Should drain at override rate');
        });
    });

    describe('Depletion & Limits', () => {
        it('should become depleted when charge hits 0', () => {
            const dt = 1.0;
            const velocity = new THREE.Vector3(10, 0, 0);

            // Force nearly empty
            battery.current = 1.0;
            window.app.world.batteryDrain = 2.0; // Ensure we cross 0

            battery.update(dt, velocity);

            assert.equal(battery.current, 0, 'Should clamp to 0');
            assert.equal(battery.depleted, true, 'Should mark as depleted');
        });

        it('should stop draining when depleted', () => {
            battery.current = 0;
            battery.depleted = true;

            const dt = 1.0;
            const velocity = new THREE.Vector3(10, 0, 0);

            battery.update(dt, velocity);

            assert.equal(battery.current, 0, 'Should stay at 0');
        });
    });

    describe('Recharge', () => {
        it('should add charge up to max', () => {
            battery.current = 50;
            battery.add(20);
            assert.equal(battery.current, 70);

            battery.add(1000); // Overshoot
            assert.equal(battery.current, CONFIG.BATTERY.MAX, 'Should clamp to max');
        });

        it('should revive from depleted state', () => {
            battery.current = 0;
            battery.depleted = true;

            battery.add(10);

            assert.equal(battery.current, 10);
            assert.equal(battery.depleted, false, 'Should no longer be depleted');
        });
    });

    describe('Reset', () => {
        it('should reset to full health', () => {
            battery.current = 10;
            battery.depleted = true;

            battery.reset();

            assert.equal(battery.current, CONFIG.BATTERY.MAX);
            assert.equal(battery.depleted, false);
        });
    });
});
