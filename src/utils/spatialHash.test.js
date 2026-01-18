
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SpatialHash } from './spatialHash.js';

describe('SpatialHash', () => {
    it('should insert and query an object within a single cell', () => {
        const hash = new SpatialHash(10);
        const client = { id: 'obj1' };
        const aabb = { min: { x: 5, z: 5 }, max: { x: 6, z: 6 } };

        hash.insert(client, aabb);

        const result = hash.query(5, 5);
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0], client);
    });

    it('should return empty array for empty cell', () => {
        const hash = new SpatialHash(10);
        const result = hash.query(100, 100);
        assert.deepStrictEqual(result, []);
    });

    it('should handle negative coordinates correctly', () => {
        const hash = new SpatialHash(10);
        const client = { id: 'negObj' };
        // Center at -15, -15 (cell -2, -2)
        const aabb = { min: { x: -16, z: -16 }, max: { x: -14, z: -14 } };

        hash.insert(client, aabb);

        // Query point inside
        const result = hash.query(-15, -15);
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0], client, 'Should find object at negative coords');

        // Query point outside
        const resultOutside = hash.query(15, 15);
        assert.strictEqual(resultOutside.length, 0, 'Positive coords should be empty');
    });

    it('should insert object spanning multiple cells', () => {
        const hash = new SpatialHash(10);
        const client = { id: 'bigObj' };
        // Spans from 5 to 15 in X (cells 0 and 1)
        const aabb = { min: { x: 5, z: 5 }, max: { x: 15, z: 5 } };

        hash.insert(client, aabb);

        const resultCell0 = hash.query(5, 5);
        const resultCell1 = hash.query(15, 5);

        assert.strictEqual(resultCell0.length, 1);
        assert.strictEqual(resultCell1.length, 1);
        assert.strictEqual(resultCell0[0], client);
        assert.strictEqual(resultCell1[0], client);
    });

    it('should clear all entries', () => {
        const hash = new SpatialHash(10);
        const client = { id: 'obj1' };
        const aabb = { min: { x: 5, z: 5 }, max: { x: 6, z: 6 } };

        hash.insert(client, aabb);
        hash.clear();

        const result = hash.query(5, 5);
        assert.deepStrictEqual(result, []);
    });

    it('should handle large coordinate wrapping (implementation limit)', () => {
        // The implementation uses (zi & 0xFFFF), meaning Z indices wrap every 65536 cells.
        // With cell size 10, that's 655,360 units.
        const hash = new SpatialHash(10);
        const clientNormal = { id: 'normal' };
        const clientWrapped = { id: 'wrapped' };

        // Insert at (0,0) -> Cell (0,0)
        hash.insert(clientNormal, { min: { x: 0, z: 0 }, max: { x: 1, z: 1 } });

        // Insert at Z = 65536 * 10 = 655360 -> Cell (0, 65536) -> Wraps to (0, 0) due to & 0xFFFF
        // 65536 is 0x10000. 0x10000 & 0xFFFF is 0.
        const zWrapped = 65536 * 10;
        hash.insert(clientWrapped, { min: { x: 0, z: zWrapped }, max: { x: 1, z: zWrapped + 1 } });

        // Querying (0,0) should return BOTH because of the hash collision
        const result = hash.query(0, 0);

        // This test documents the LIMITATION ("Dark Corner").
        // If the implementation changes to fix this, this test will fail and alert us.
        // For now, we assert that the collision DOES happen.
        assert.strictEqual(result.length, 2, 'Should have collision due to bit-packing limit');
        assert.ok(result.includes(clientNormal));
        assert.ok(result.includes(clientWrapped));
    });
});
