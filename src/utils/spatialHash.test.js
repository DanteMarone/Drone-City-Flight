import { describe, it } from 'node:test';
import { strict as assert } from 'assert';
import { SpatialHash } from './spatialHash.js';

describe('SpatialHash', () => {
    it('should initialize with correct cell size', () => {
        const hash = new SpatialHash(10);
        assert.equal(hash.cellSize, 10);
    });

    it('should insert and query a simple object', () => {
        const hash = new SpatialHash(10);
        const client = { id: 1 };
        const aabb = { min: { x: 5, z: 5 }, max: { x: 6, z: 6 } };

        hash.insert(client, aabb);
        const result = hash.query(5, 5);

        assert.equal(result.length, 1);
        assert.equal(result[0], client);
    });

    it('should handle negative coordinates', () => {
        const hash = new SpatialHash(10);
        const client = { id: 2 };
        const aabb = { min: { x: -5, z: -5 }, max: { x: -4, z: -4 } };

        hash.insert(client, aabb);
        const result = hash.query(-5, -5);

        assert.equal(result.length, 1);
        assert.equal(result[0], client);
    });

    it('should handle objects spanning multiple cells', () => {
        const hash = new SpatialHash(10);
        const client = { id: 3 };
        // Spans from (0,0) to (11,11). Cells: (0,0), (0,1), (1,0), (1,1)
        const aabb = { min: { x: 0, z: 0 }, max: { x: 11, z: 11 } };

        hash.insert(client, aabb);

        assert.equal(hash.query(0, 0).length, 1, 'Query 0,0');
        assert.equal(hash.query(11, 11).length, 1, 'Query 11,11');
        assert.equal(hash.query(0, 11).length, 1, 'Query 0,11');
        assert.equal(hash.query(11, 0).length, 1, 'Query 11,0');
    });

    it('should clear all entries', () => {
        const hash = new SpatialHash(10);
        const client = { id: 1 };
        const aabb = { min: { x: 5, z: 5 }, max: { x: 6, z: 6 } };

        hash.insert(client, aabb);
        hash.clear();

        assert.equal(hash.query(5, 5).length, 0);
    });

    it('should demonstrate key collision edge case (Documentation Check)', () => {
        // This test documents the known limitation of the bitwise hashing
        // _getKey(0, -1) collides with _getKey(0, 65535) due to 16-bit mask
        const hash = new SpatialHash(1); // Cell size 1 to map directly to integers
        const clientA = { id: 'A' };
        const clientB = { id: 'B' };

        // Insert A at (0, -1)
        hash.insert(clientA, { min: {x: 0, z: -1}, max: {x: 0, z: -1} });

        // Insert B at (0, 65535)
        hash.insert(clientB, { min: {x: 0, z: 65535}, max: {x: 0, z: 65535} });

        // Querying (0, -1) should ideally only return A, but due to collision returns A and B
        const result = hash.query(0, -1);

        // Code is Truth: We assert the collision happens
        assert.equal(result.length, 2, 'Collision expected between -1 and 65535');
        assert.ok(result.includes(clientA));
        assert.ok(result.includes(clientB));
    });
});
