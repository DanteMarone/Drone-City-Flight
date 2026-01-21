
import { describe, it } from 'node:test';
import { strict as assert } from 'assert';
import { SpatialHash } from './spatialHash.js';

describe('SpatialHash', () => {
    describe('Initialization', () => {
        it('should initialize with correct cell size', () => {
            const hash = new SpatialHash(10);
            assert.equal(hash.cellSize, 10);
            assert.equal(hash.cells.size, 0);
        });
    });

    describe('Key Generation', () => {
        // We access _getKey directly for white-box testing of the bit-packing logic

        it('should generate unique keys for distinct nearby cells', () => {
            const hash = new SpatialHash(10);
            const key1 = hash._getKey(5, 5);   // Cell 0, 0
            const key2 = hash._getKey(15, 5);  // Cell 1, 0
            const key3 = hash._getKey(5, 15);  // Cell 0, 1

            assert.notEqual(key1, key2);
            assert.notEqual(key1, key3);
            assert.notEqual(key2, key3);
        });

        it('should map different coordinates in same cell to same key', () => {
            const hash = new SpatialHash(10);
            const key1 = hash._getKey(1, 1);
            const key2 = hash._getKey(9, 9);
            assert.equal(key1, key2);
        });

        it('should handle negative coordinates correctly (wrapping logic)', () => {
            const hash = new SpatialHash(10);
            const keyNeg = hash._getKey(5, -5); // Cell 0, -1

            // Due to bitwise & 0xFFFF, -1 becomes 65535
            // So key for (0, -1) should equal key for (0, 65535)
            const keyWrap = hash._getKey(5, 655350 + 5); // Cell 0, 65535

            assert.equal(keyNeg, keyWrap, 'Negative Z should alias to high positive Z due to 16-bit mask');
        });
    });

    describe('Insert and Query', () => {
        it('should insert and retrieve an item', () => {
            const hash = new SpatialHash(10);
            const item = { id: 1 };
            const aabb = { min: { x: 0, z: 0 }, max: { x: 5, z: 5 } };

            hash.insert(item, aabb);

            const result = hash.query(2, 2);
            assert.equal(result.length, 1);
            assert.equal(result[0], item);
        });

        it('should handle objects spanning multiple cells', () => {
            const hash = new SpatialHash(10);
            const item = { id: 'big' };
            // Spans from 5 to 15 (Cells 0 and 1 on X)
            const aabb = { min: { x: 5, z: 5 }, max: { x: 15, z: 5 } };

            hash.insert(item, aabb);

            assert.equal(hash.query(2, 5).length, 1, 'Should be in cell 0');
            assert.equal(hash.query(12, 5).length, 1, 'Should be in cell 1');
        });

        it('should return empty array for empty cells', () => {
            const hash = new SpatialHash(10);
            const result = hash.query(100, 100);
            assert.deepEqual(result, []);
        });
    });

    describe('Limits and Edge Cases', () => {
        it('should handle X-axis wrapping (Overflow)', () => {
            const hash = new SpatialHash(10);
            // X index 65536. 65536 << 16 becomes 0 in 32-bit signed int
            const xWrap = 65536 * 10;

            const keyZero = hash._getKey(0, 0);
            const keyWrap = hash._getKey(xWrap, 0);

            assert.equal(keyZero, keyWrap, 'X index should wrap every 65536 cells');
        });

        it('should handle Z-axis wrapping (Masking)', () => {
            const hash = new SpatialHash(10);
            // Z index 65536. 65536 & 0xFFFF is 0.
            const zWrap = 65536 * 10;

            const keyZero = hash._getKey(0, 0);
            const keyWrap = hash._getKey(0, zWrap);

            assert.equal(keyZero, keyWrap, 'Z index should wrap every 65536 cells');
        });
    });

    describe('Maintenance', () => {
        it('should clear all cells', () => {
            const hash = new SpatialHash(10);
            const item = { id: 1 };
            const aabb = { min: { x: 0, z: 0 }, max: { x: 5, z: 5 } };

            hash.insert(item, aabb);
            assert.equal(hash.cells.size, 1);

            hash.clear();
            assert.equal(hash.cells.size, 0);
            assert.deepEqual(hash.query(2, 2), []);
        });
    });
});
