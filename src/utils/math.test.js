
import { describe, it } from 'node:test';
import { strict as assert } from 'assert';
import { clamp, lerp, damp } from './math.js';

describe('Math Utils', () => {

    describe('clamp', () => {
        it('should return value if within range', () => {
            assert.equal(clamp(5, 0, 10), 5);
        });

        it('should return min if value is less than min', () => {
            assert.equal(clamp(-5, 0, 10), 0);
        });

        it('should return max if value is greater than max', () => {
            assert.equal(clamp(15, 0, 10), 10);
        });

        it('should handle negative ranges', () => {
            assert.equal(clamp(-15, -20, -10), -15);
            assert.equal(clamp(-25, -20, -10), -20);
            assert.equal(clamp(-5, -20, -10), -10);
        });
    });

    describe('lerp', () => {
        it('should interpolate between start and end', () => {
            assert.equal(lerp(0, 10, 0), 0);
            assert.equal(lerp(0, 10, 0.5), 5);
            assert.equal(lerp(0, 10, 1), 10);
        });

        it('should handle extrapolation', () => {
            assert.equal(lerp(0, 10, 2), 20);
            assert.equal(lerp(0, 10, -1), -10);
        });

        it('should work with negative numbers', () => {
            assert.equal(lerp(-10, 10, 0.5), 0);
        });
    });

    describe('damp', () => {
        const decay = 10;

        it('should return current value if dt is 0', () => {
            assert.equal(damp(0, 10, decay, 0), 0);
        });

        it('should approach target over time', () => {
            const result = damp(0, 10, decay, 0.1);
            // 1 - exp(-10 * 0.1) = 1 - exp(-1) = 1 - 0.3678 = 0.6321
            // lerp(0, 10, 0.6321) = 6.321
            assert(result > 0);
            assert(result < 10);
            assert(Math.abs(result - 6.321) < 0.001);
        });

        it('should be effectively frame-rate independent', () => {
            // Compare one big step vs many small steps
            const target = 100;
            const decayRate = 5;

            // One step of 0.1s
            const oneStep = damp(0, target, decayRate, 0.1);

            // Ten steps of 0.01s
            let manySteps = 0;
            for(let i=0; i<10; i++) {
                manySteps = damp(manySteps, target, decayRate, 0.01);
            }

            // Allow small float error
            assert(Math.abs(oneStep - manySteps) < 0.0001, `Expected ${oneStep} to equal ${manySteps}`);
        });

        it('should reach target if decay is very high or time is long', () => {
             const result = damp(0, 10, 1000, 1);
             assert(Math.abs(result - 10) < 0.001);
        });
    });
});
