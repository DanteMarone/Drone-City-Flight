
import { describe, it } from 'node:test';
import { strict as assert } from 'assert';
import { SpatialHash } from './spatialHash.js';

describe('SpatialHash', () => {

    describe('Basic Functionality', () => {
        it('should insert and query objects', () => {
            const hash = new SpatialHash(10);
            const client = { id: 1 };
            const aabb = { min: { x: 5, z: 5 }, max: { x: 5, z: 5 } };

            hash.insert(client, aabb);

            const result = hash.query(5, 5);
            assert.equal(result.length, 1);
            assert.equal(result[0], client);
        });

        it('should handle clearing', () => {
            const hash = new SpatialHash(10);
            const client = { id: 1 };
            const aabb = { min: { x: 5, z: 5 }, max: { x: 5, z: 5 } };

            hash.insert(client, aabb);
            hash.clear();

            const result = hash.query(5, 5);
            assert.equal(result.length, 0);
        });
    });

    describe('AABB Coverage', () => {
        it('should add object to all covered cells', () => {
            const hash = new SpatialHash(10);
            const client = { id: 'large' };
            // Spans from (0,0) to (15,15) -> Should cover cells (0,0), (0,1), (1,0), (1,1)
            const aabb = { min: { x: 0, z: 0 }, max: { x: 15, z: 15 } };

            hash.insert(client, aabb);

            const cells = [
                hash.query(0, 0),
                hash.query(0, 10),
                hash.query(10, 0),
                hash.query(10, 10)
            ];

            cells.forEach((cell, index) => {
                assert.ok(cell.includes(client), `Cell ${index} should contain client`);
            });
        });
    });

    describe('Coordinate Handling', () => {
        it('should handle negative coordinates', () => {
            const hash = new SpatialHash(10);
            const client = { id: 'neg' };
            const aabb = { min: { x: -5, z: -5 }, max: { x: -5, z: -5 } };

            hash.insert(client, aabb);

            const result = hash.query(-5, -5);
            assert.equal(result.length, 1);
            assert.equal(result[0], client);
        });
    });

    describe('Collision Detection (Bit-packing Limits)', () => {
        it('should NOT collide for indices separated by 16 bits', () => {
            // Testing the limitation of (xi << 16) | (zi & 0xFFFF)
            // zi = -1 maps to 65535 due to & 0xFFFF
            // zi = 65535 maps to 65535

            const cellSize = 1;
            const hash = new SpatialHash(cellSize);

            const client1 = { id: 'neg1' };
            const client2 = { id: 'pos65535' };

            // Cell (0, -1)
            hash.insert(client1, { min: { x: 0, z: -1 }, max: { x: 0, z: -1 } });

            // Cell (0, 65535)
            hash.insert(client2, { min: { x: 0, z: 65535 }, max: { x: 0, z: 65535 } });

            // Querying (0, -1) should ideally NOT return client2
            const resultNeg1 = hash.query(0, -1);

            // If collision occurs, resultNeg1 will contain both or just one if overwriting (it's an array push, so both)
            const hasCollision = resultNeg1.includes(client2);

            // This assertion expects NO collision. If it fails, the "Dark Corner" is exposed.
            assert.equal(hasCollision, false, 'Hash collision detected between z=-1 and z=65535');
        });
    });
});
