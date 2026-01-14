
import { strict as assert } from 'assert';
import { SpatialHash } from './spatialHash.js';
import * as THREE from 'three';

// Test Helper (Minimal implementation for standalone running or integration)
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

describe('SpatialHash Utilities', () => {
    const cellSize = 100;
    const spatialHash = new SpatialHash(cellSize);

    it('should handle large coordinates without collision', () => {
        spatialHash.clear();

        const objNear = { id: 'near' };
        const objFar = { id: 'far' };

        // Position 1: (0, 0, 0) -> Cell (0, 0)
        // Position 2: (0, 0, 6553600) -> Cell (0, 65536)
        // With 16-bit masking (zi & 0xFFFF), 65536 becomes 0.
        // So this triggers a collision in the buggy implementation.

        const zFar = 65536 * cellSize;

        // Insert Near
        spatialHash.insert(objNear, new THREE.Box3(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(10, 10, 10)
        ));

        // Insert Far
        spatialHash.insert(objFar, new THREE.Box3(
            new THREE.Vector3(0, 0, zFar),
            new THREE.Vector3(10, 10, zFar + 10)
        ));

        // Query Near (0,0)
        const nearResult = spatialHash.query(5, 5);
        assert.ok(nearResult.includes(objNear), 'Should find near object');
        assert.ok(!nearResult.includes(objFar), 'Should NOT find far object (Collision detected!)');

        // Query Far (0, zFar)
        const farResult = spatialHash.query(5, zFar + 5);
        assert.ok(farResult.includes(objFar), 'Should find far object');
        assert.ok(!farResult.includes(objNear), 'Should NOT find near object at far location');
    });

    it('should correctly handle negative coordinates vs positive', () => {
        spatialHash.clear();
        const objPos = { id: 'pos' };
        const objNeg = { id: 'neg' };

        // (0,0)
        spatialHash.insert(objPos, new THREE.Box3(
            new THREE.Vector3(0, 0, 0), new THREE.Vector3(10, 10, 10)
        ));

        // (-1, -1) -> In cell coords, often -1.
        spatialHash.insert(objNeg, new THREE.Box3(
            new THREE.Vector3(-50, 0, -50), new THREE.Vector3(-40, 10, -40)
        ));

        const resPos = spatialHash.query(5, 5);
        assert.ok(resPos.includes(objPos));
        assert.ok(!resPos.includes(objNeg));
    });
});
