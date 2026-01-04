import * as THREE from 'three';
import { strict as assert } from 'assert';
import { TimeCycle } from './timeCycle.js';

// Test Helper (Minimal runner)
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
// Suite: TimeCycle
// -----------------------------------------------------------------------------
describe('TimeCycle', () => {

    it('should initialize with default values', () => {
        const timeCycle = new TimeCycle();
        assert.equal(timeCycle.time, 12.0, 'Should start at noon (12.0)');
        assert.equal(timeCycle.speed, 0.0, 'Should start with 0 speed');
        assert.equal(timeCycle.isLocked, false, 'Should not be locked by default');
    });

    it('should advance time based on speed and dt', () => {
        const timeCycle = new TimeCycle();
        timeCycle.speed = 1.0; // 1 game hour per real hour (1/3600 hours per sec)
        // Wait, logic is: time += (dt * speed) / 3600
        // If speed = 3600, then time += dt. So 1 second dt = 1 hour.

        timeCycle.speed = 3600.0;
        const dt = 1.0; // 1 second

        timeCycle.update(dt);

        // 12 + 1 = 13
        assert.ok(Math.abs(timeCycle.time - 13.0) < 0.0001, 'Time should advance by 1 hour');
    });

    it('should wrap time around 24 hours', () => {
        const timeCycle = new TimeCycle();
        timeCycle.time = 23.5;
        timeCycle.speed = 3600.0; // 1 hour per second
        const dt = 1.0; // Advance 1 hour -> 24.5 -> 0.5

        timeCycle.update(dt);

        assert.ok(Math.abs(timeCycle.time - 0.5) < 0.0001, 'Time should wrap to 0.5');
    });

    it('should calculate sun position correctly', () => {
        const timeCycle = new TimeCycle();

        // Noon (12) -> +Y (Up)
        timeCycle.time = 12.0;
        timeCycle._updateSunPosition();
        // Radius is 100
        assert.ok(Math.abs(timeCycle.sunPosition.y - 100) < 0.001, 'Noon sun should be at +Y 100');
        assert.ok(Math.abs(timeCycle.sunPosition.x) < 0.001, 'Noon sun should be at X 0');

        // 6am -> +X (East-ish?) or whatever logic is
        // Logic: theta = (6/24)*2PI - PI/2 = PI/2 - PI/2 = 0. Cos(0)=1 (X).
        timeCycle.time = 6.0;
        timeCycle._updateSunPosition();
        assert.ok(Math.abs(timeCycle.sunPosition.x - 100) < 0.001, '6am sun should be at +X 100');

        // 6pm (18) -> -X
        // Logic: theta = (18/24)*2PI - PI/2 = 1.5PI - 0.5PI = PI. Cos(PI)=-1.
        timeCycle.time = 18.0;
        timeCycle._updateSunPosition();
        assert.ok(Math.abs(timeCycle.sunPosition.x - -100) < 0.001, '6pm sun should be at -X 100');
    });

    it('should interpolate colors between keyframes', () => {
        const timeCycle = new TimeCycle();
        // Keyframes:
        // 12: sun=0xffffff
        // 16: sun=0xffddaa
        // Let's test 14:00 (midpoint)

        timeCycle.time = 14.0;
        timeCycle._updateLightingValues();

        const c1 = new THREE.Color(0xffffff);
        const c2 = new THREE.Color(0xffddaa);
        const expected = c1.lerp(c2, 0.5);

        assert.ok(Math.abs(timeCycle.sunColor.r - expected.r) < 0.001, 'Red channel matches');
        assert.ok(Math.abs(timeCycle.sunColor.g - expected.g) < 0.001, 'Green channel matches');
        assert.ok(Math.abs(timeCycle.sunColor.b - expected.b) < 0.001, 'Blue channel matches');
    });

    it('should handle manual time setting and update logic', () => {
        const timeCycle = new TimeCycle();
        timeCycle.time = 10.0;
        // Check updates happen
        timeCycle._updateSunPosition();

        // Just verify it doesn't crash and sets values
        assert.ok(timeCycle.sunPosition.lengthSq() > 0, 'Sun position updated');
    });

    it('should respect isLocked flag', () => {
        const timeCycle = new TimeCycle();
        timeCycle.time = 12.0;
        timeCycle.speed = 3600.0;
        timeCycle.isLocked = true;

        timeCycle.update(1.0);

        assert.equal(timeCycle.time, 12.0, 'Time should not advance when locked');
    });
});
