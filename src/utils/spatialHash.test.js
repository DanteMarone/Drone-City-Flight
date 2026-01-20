
import { describe, it } from 'node:test';
import { strict as assert } from 'assert';
import { SpatialHash } from './spatialHash.js';

describe('SpatialHash', () => {
    describe('Key Generation', () => {
        it('should generate unique keys for different coordinates', () => {
            const sh = new SpatialHash(10);
            // x=0, z=0 -> xi=0, zi=0
            const key1 = sh._getKey(0, 0);
            // x=10, z=0 -> xi=1, zi=0
            const key2 = sh._getKey(10, 0);

            assert.notEqual(key1, key2, 'Keys should differ for different x');
        });

        it('should wrap Z coordinates every 65536 cells', () => {
            const sh = new SpatialHash(1); // cellSize = 1 for simpler math

            // zi = 0
            const key1 = sh._getKey(0, 0);
            // zi = 65536 (0x10000)
            const key2 = sh._getKey(0, 65536);

            // 0x10000 & 0xFFFF is 0. So they should match.
            assert.equal(key1, key2, 'Keys should collide due to Z wrapping at 65536');
        });

        it('should map negative Z to high positive Z due to bit masking', () => {
            const sh = new SpatialHash(1);

            // zi = -1
            const keyNeg = sh._getKey(0, -1);
            // zi = 65535 (0xFFFF)
            const keyPos = sh._getKey(0, 65535);

            // -1 & 0xFFFF is 0xFFFF.
            assert.equal(keyNeg, keyPos, 'Negative Z should map to high positive Z');
        });

        it('should handle X wrapping at 65536 cells', () => {
             const sh = new SpatialHash(1);
             // xi = 0
             const key1 = sh._getKey(0, 0);
             // xi = 65536. 65536 << 16 is 0 in 32-bit integer arithmetic (bits shifted out)
             const key2 = sh._getKey(65536, 0);

             assert.equal(key1, key2, 'Keys should collide due to X wrapping at 65536');
        });
    });

    describe('Insertion and Query', () => {
        it('should insert and retrieve objects', () => {
            const sh = new SpatialHash(10);
            const obj = { id: 'obj1' };
            const aabb = { min: { x: 5, z: 5 }, max: { x: 5, z: 5 } }; // Single point/cell

            sh.insert(obj, aabb);
            const result = sh.query(5, 5);

            assert.equal(result.length, 1);
            assert.equal(result[0], obj);
        });

        it('should handle objects spanning multiple cells', () => {
            const sh = new SpatialHash(10);
            const obj = { id: 'largeObj' };
            // Spans from (5,5) to (15,15). Cell 0,0 and Cell 1,1
            // cellSize 10.
            // minX = floor(5/10) = 0. maxX = floor(15/10) = 1.
            // minZ = floor(5/10) = 0. maxZ = floor(15/10) = 1.
            // Should cover (0,0), (0,1), (1,0), (1,1)

            const aabb = { min: { x: 5, z: 5 }, max: { x: 15, z: 15 } };
            sh.insert(obj, aabb);

            assert.equal(sh.query(5, 5).length, 1, 'Should be in 0,0');
            assert.equal(sh.query(15, 15).length, 1, 'Should be in 1,1');
            assert.equal(sh.query(5, 15).length, 1, 'Should be in 0,1');
            assert.equal(sh.query(15, 5).length, 1, 'Should be in 1,0');
        });

        it('should return empty array for empty cell', () => {
            const sh = new SpatialHash(10);
            assert.equal(sh.query(100, 100).length, 0);
        });
    });

    describe('Clear', () => {
        it('should remove all objects', () => {
            const sh = new SpatialHash(10);
            const obj = { id: 'obj1' };
            const aabb = { min: { x: 5, z: 5 }, max: { x: 5, z: 5 } };

            sh.insert(obj, aabb);
            assert.equal(sh.query(5, 5).length, 1);

            sh.clear();
            assert.equal(sh.query(5, 5).length, 0);
        });
    });
});
