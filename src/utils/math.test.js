import { describe, it } from 'node:test';
import assert from 'node:assert';
import { clamp, lerp, damp } from './math.js';

describe('Math Utils', () => {
    describe('clamp', () => {
        it('should return value when within range', () => {
            assert.strictEqual(clamp(5, 0, 10), 5);
        });

        it('should return min when value is below range', () => {
            assert.strictEqual(clamp(-5, 0, 10), 0);
        });

        it('should return max when value is above range', () => {
            assert.strictEqual(clamp(15, 0, 10), 10);
        });

        it('should handle negative ranges', () => {
            assert.strictEqual(clamp(-15, -20, -10), -15);
            assert.strictEqual(clamp(-25, -20, -10), -20);
            assert.strictEqual(clamp(-5, -20, -10), -10);
        });

        it('should handle floating point numbers', () => {
            assert.strictEqual(clamp(0.5, 0.1, 0.9), 0.5);
            assert.strictEqual(clamp(0.05, 0.1, 0.9), 0.1);
        });
    });

    describe('lerp', () => {
        it('should interpolate correctly', () => {
            assert.strictEqual(lerp(0, 10, 0.5), 5);
        });

        it('should return start when t=0', () => {
            assert.strictEqual(lerp(0, 10, 0), 0);
        });

        it('should return end when t=1', () => {
            assert.strictEqual(lerp(0, 10, 1), 10);
        });

        it('should extrapolate when t > 1', () => {
            assert.strictEqual(lerp(0, 10, 2), 20);
        });

        it('should extrapolate when t < 0', () => {
            assert.strictEqual(lerp(0, 10, -1), -10);
        });

        it('should handle negative values', () => {
            assert.strictEqual(lerp(-10, 10, 0.5), 0);
        });
    });

    describe('damp', () => {
        const approxEqual = (actual, expected, tolerance = 0.0001) => {
            const diff = Math.abs(actual - expected);
            if (diff > tolerance) {
                assert.fail(`Expected ${actual} to be close to ${expected} (diff: ${diff})`);
            }
        };

        it('should move towards target', () => {
            const current = 0;
            const target = 10;
            const decay = 1;
            const dt = 1;
            const result = damp(current, target, decay, dt);

            // Expected: 0 + (10 - 0) * (1 - exp(-1 * 1)) = 10 * (1 - 0.3678) = 6.321
            assert.ok(result > current);
            assert.ok(result < target);
            approxEqual(result, 6.3212, 0.0001);
        });

        it('should not move if dt is 0', () => {
            assert.strictEqual(damp(0, 10, 5, 0), 0);
        });

        it('should not move if decay is 0', () => {
            assert.strictEqual(damp(0, 10, 0, 1), 0);
        });

        it('should approach target over many steps', () => {
            let current = 0;
            const target = 100;
            const decay = 5;
            const dt = 0.1;

            for (let i = 0; i < 50; i++) {
                current = damp(current, target, decay, dt);
            }

            approxEqual(current, target, 0.1);
        });

        it('should handle negative decay (unstable/repel)', () => {
             // If decay is negative, exp(-decay) becomes exp(positive), which is > 1.
             // 1 - exp(huge) is huge negative.
             // lerp(0, 10, negative_huge) => 0 * (1 - neg) + 10 * neg => huge negative number.
             // This tests that the function behaves mathematically as expected, even if undesirable physically.
             const result = damp(0, 10, -1, 1);
             // 1 - exp(1) = 1 - 2.718 = -1.718
             // lerp(0, 10, -1.718) = 0 - 17.18 = -17.18
             approxEqual(result, -17.1828, 0.001);
        });

        it('should reach target immediately if decay is infinity (conceptually)', () => {
             // Math.exp(-Infinity) is 0.
             // 1 - 0 = 1.
             // lerp(c, t, 1) = t.
             assert.strictEqual(damp(0, 10, Infinity, 1), 10);
        });
    });
});
