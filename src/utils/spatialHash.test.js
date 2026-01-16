import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SpatialHash } from './spatialHash.js';

describe('SpatialHash', () => {
    it('should insert and query an object in a single cell', () => {
        const hash = new SpatialHash(10);
        const client = { id: 1 };
        // Center of cell 0,0 is 5,5 (0-10)
        const aabb = { min: { x: 5, z: 5 }, max: { x: 6, z: 6 } };

        hash.insert(client, aabb);

        const result = hash.query(5, 5);
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0], client);
    });

    it('should return empty array for empty cell', () => {
        const hash = new SpatialHash(10);
        const result = hash.query(100, 100);
        assert.strictEqual(result.length, 0);
    });

    it('should handle negative coordinates correctly', () => {
        const hash = new SpatialHash(10);
        const client = { id: 2 };
        // x: -5 (cell -1), z: -5 (cell -1)
        const aabb = { min: { x: -5, z: -5 }, max: { x: -4, z: -4 } };

        hash.insert(client, aabb);

        const result = hash.query(-5, -5);
        assert.strictEqual(result.length, 1, 'Should find object at negative coords');
        assert.strictEqual(result[0], client);
    });

    it('should handle objects spanning multiple cells', () => {
        const hash = new SpatialHash(10);
        const client = { id: 3 };
        // Spans from x=5 (cell 0) to x=15 (cell 1)
        const aabb = { min: { x: 5, z: 5 }, max: { x: 15, z: 5 } };

        hash.insert(client, aabb);

        const cell0 = hash.query(5, 5);
        const cell1 = hash.query(15, 5);

        assert.strictEqual(cell0.length, 1, 'Should be in cell 0');
        assert.strictEqual(cell1.length, 1, 'Should be in cell 1');
        assert.strictEqual(cell0[0], client);
        assert.strictEqual(cell1[0], client);
    });

    it('should handle symmetric coordinates across zero', () => {
         // This tests the bitwise logic for (0, -1) and (-1, 0)
         const hash = new SpatialHash(10);
         const c1 = { id: 'A' }; // 0, -1
         const c2 = { id: 'B' }; // -1, 0

         // Cell 0, -1 -> x in [0, 9], z in [-10, -1]
         hash.insert(c1, { min: {x: 5, z: -5}, max: {x: 5, z: -5} });
         // Cell -1, 0 -> x in [-10, -1], z in [0, 9]
         hash.insert(c2, { min: {x: -5, z: 5}, max: {x: -5, z: 5} });

         const res1 = hash.query(5, -5);
         const res2 = hash.query(-5, 5);

         assert.strictEqual(res1.length, 1);
         assert.strictEqual(res1[0], c1);

         assert.strictEqual(res2.length, 1);
         assert.strictEqual(res2[0], c2);
    });

    it('should clear all cells', () => {
        const hash = new SpatialHash(10);
        hash.insert({}, { min: {x:0, z:0}, max: {x:0, z:0} });
        hash.clear();
        assert.strictEqual(hash.cells.size, 0);
    });

    it('should handle large coordinates', () => {
        const hash = new SpatialHash(10);
        const client = { id: 'far' };
        // 32000 * 10 = 320,000 units. Just within signed 16-bit range of cell indices (-32768 to 32767)
        // If x = 320000, cell = 32000.
        const pos = 320000;
        hash.insert(client, { min: {x: pos, z: pos}, max: {x: pos, z: pos} });

        const res = hash.query(pos, pos);
        assert.strictEqual(res.length, 1);
        assert.strictEqual(res[0], client);
    });
});
