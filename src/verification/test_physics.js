// src/verification/test_physics.js
import * as THREE from 'three';
import { strict as assert } from 'assert';
import { SpatialHash } from '../utils/spatialHash.js';
import { ColliderSystem } from '../world/colliders.js';

// Test Helper
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
// Suite: SpatialHash
// -----------------------------------------------------------------------------
describe('SpatialHash', () => {
    const cellSize = 100;
    const spatialHash = new SpatialHash(cellSize);

    it('should distinguish objects in different cells', () => {
        spatialHash.clear();
        const obj1 = { id: 1 };
        const obj2 = { id: 2 };
        const obj3 = { id: 3 };

        // Insert objects into different expected cells
        // Cell 0,0
        spatialHash.insert(obj1, new THREE.Box3(
            new THREE.Vector3(10, 0, 10), new THREE.Vector3(20, 10, 20)
        ));

        // Cell 1,0
        spatialHash.insert(obj2, new THREE.Box3(
            new THREE.Vector3(110, 0, 10), new THREE.Vector3(120, 10, 20)
        ));

        // Cell 0,1
        spatialHash.insert(obj3, new THREE.Box3(
            new THREE.Vector3(10, 0, 110), new THREE.Vector3(20, 10, 120)
        ));

        // Query Cell 0,0
        const res1 = spatialHash.query(15, 15);
        assert.ok(res1.includes(obj1), 'Cell 0,0 should have obj1');
        assert.ok(!res1.includes(obj2), 'Cell 0,0 should NOT have obj2');
        assert.ok(!res1.includes(obj3), 'Cell 0,0 should NOT have obj3');

        // Query Cell 1,0
        const res2 = spatialHash.query(115, 15);
        assert.ok(res2.includes(obj2), 'Cell 1,0 should have obj2');
        assert.ok(!res2.includes(obj1), 'Cell 1,0 should NOT have obj1');
    });

    it('should handle negative coordinates without aliasing', () => {
        spatialHash.clear();
        const originObj = { id: 'origin' }; // (0,0)
        const negXObj = { id: 'negX' };     // (-1, 0) -> should be distinct from origin
        const negZObj = { id: 'negZ' };     // (0, -1) -> should be distinct from origin
        const negBothObj = { id: 'negBoth' }; // (-1, -1)

        // Insert Origin (0..10)
        spatialHash.insert(originObj, new THREE.Box3(
            new THREE.Vector3(0, 0, 0), new THREE.Vector3(10, 10, 10)
        ));

        // Insert Negative X (-50..-40) -> Cell -1,0
        spatialHash.insert(negXObj, new THREE.Box3(
            new THREE.Vector3(-50, 0, 0), new THREE.Vector3(-40, 10, 10)
        ));

        // Insert Negative Z (0..10, -50..-40) -> Cell 0,-1
        spatialHash.insert(negZObj, new THREE.Box3(
            new THREE.Vector3(0, 0, -50), new THREE.Vector3(10, 10, -40)
        ));

        // Insert Negative Both (-50..-40, -50..-40) -> Cell -1,-1
        spatialHash.insert(negBothObj, new THREE.Box3(
            new THREE.Vector3(-50, 0, -50), new THREE.Vector3(-40, 10, -40)
        ));

        // Verify Origin Query
        const qOrigin = spatialHash.query(5, 5);
        assert.ok(qOrigin.includes(originObj), 'Query(5,5) finds origin');
        assert.ok(!qOrigin.includes(negXObj), 'Query(5,5) does NOT find negX');
        assert.ok(!qOrigin.includes(negZObj), 'Query(5,5) does NOT find negZ');

        // Verify Negative X Query (-45, 5)
        const qNegX = spatialHash.query(-45, 5);
        assert.ok(qNegX.includes(negXObj), 'Query(-45,5) finds negX');
        assert.ok(!qNegX.includes(originObj), 'Query(-45,5) does NOT find origin');

        // Verify Negative Z Query (5, -45)
        const qNegZ = spatialHash.query(5, -45);
        assert.ok(qNegZ.includes(negZObj), 'Query(5,-45) finds negZ');

        // Verify Negative Both Query (-45, -45)
        const qNegBoth = spatialHash.query(-45, -45);
        assert.ok(qNegBoth.includes(negBothObj), 'Query(-45,-45) finds negBothObj');

        // Ensure NO aliasing between (-1,-1) and (65535, 65535) if we were testing masking
        // But functionally, we just ensure negative coords work independently.
    });

    it('should insert and retrieve objects', () => {
        spatialHash.clear();
        const obj = { id: 1 };
        const box = new THREE.Box3(
            new THREE.Vector3(10, 0, 10),
            new THREE.Vector3(20, 10, 20)
        );

        spatialHash.insert(obj, box);

        const results = spatialHash.query(15, 15);
        assert.ok(results.includes(obj), 'Should find object in query');

        const emptyResults = spatialHash.query(200, 200);
        assert.ok(!emptyResults.includes(obj), 'Should not find object far away');
    });

    it('should handle objects spanning multiple cells', () => {
        spatialHash.clear();
        const obj = { id: 'big' };
        // Box spans from (10,0,10) to (110,10,110) -> Covers cells (0,0), (1,0), (0,1), (1,1)
        const box = new THREE.Box3(
            new THREE.Vector3(10, 0, 10),
            new THREE.Vector3(110, 10, 110)
        );

        spatialHash.insert(obj, box);

        // Query (0,0)
        assert.ok(spatialHash.query(50, 50).includes(obj), 'Found in cell 0,0');
        // Query (1,1)
        assert.ok(spatialHash.query(105, 105).includes(obj), 'Found in cell 1,1');
        // Query (2,2) - Should not be there
        assert.ok(!spatialHash.query(205, 205).includes(obj), 'Not found in cell 2,2');
    });
});

// -----------------------------------------------------------------------------
// Suite: ColliderSystem
// -----------------------------------------------------------------------------
describe('ColliderSystem', () => {
    const colliderSystem = new ColliderSystem();

    it('should add static colliders', () => {
        colliderSystem.clear();
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10));
        mesh.position.set(0, 5, 0); // Centered at 0,5,0. Box min:-5,0,-5 max:5,10,5
        mesh.updateMatrixWorld();
        mesh.geometry.computeBoundingBox();
        const box = new THREE.Box3().copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld);

        colliderSystem.addStatic([{ mesh, box }]);

        assert.equal(colliderSystem.staticColliders.length, 1);

        // Query via spatial hash implicitly
        const nearby = colliderSystem.spatialHash.query(0, 0);
        assert.equal(nearby.length, 1);
        assert.equal(nearby[0].mesh, mesh);
    });

    it('should check collisions with static objects', () => {
        // Setup: Box at (100, 5, 100) size 10
        colliderSystem.clear();
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10));
        mesh.position.set(100, 5, 100);
        mesh.updateMatrixWorld();

        // Create manual box
        const box = new THREE.Box3().setFromObject(mesh);

        colliderSystem.addStatic([{ mesh, box }]);

        // Drone at collision point (100, 5, 100) radius 1
        const dronePos = new THREE.Vector3(100, 5, 100);
        const hits = colliderSystem.checkCollisions(dronePos, 1.0);

        assert.ok(hits.length > 0, 'Should detect collision inside box');
        assert.equal(hits[0].object.mesh, mesh);
    });

    it('should detect ground collision', () => {
        // Drone at y=0.5, radius=1.0 -> Should hit ground (y=0)
        const dronePos = new THREE.Vector3(0, 0.5, 0);
        const hits = colliderSystem.checkCollisions(dronePos, 1.0);

        const groundHit = hits.find(h => h.object.type === 'ground');
        assert.ok(groundHit, 'Should hit ground');
        assert.ok(groundHit.penetration > 0, 'Should have penetration');
        // penetration = radius - y = 1.0 - 0.5 = 0.5
        assert.ok(Math.abs(groundHit.penetration - 0.5) < 0.001, 'Penetration should be 0.5');
    });

    it('should update collider when mesh moves', () => {
        colliderSystem.clear();
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10));
        mesh.position.set(0, 5, 0);
        mesh.updateMatrixWorld();
        const box = new THREE.Box3().setFromObject(mesh);

        colliderSystem.addStatic([{ mesh, box }]);

        // Move mesh to (200, 5, 0)
        mesh.position.set(200, 5, 0);
        mesh.updateMatrixWorld();

        // Must call updateBody
        colliderSystem.updateBody(mesh);

        // Old position query
        const oldQuery = colliderSystem.spatialHash.query(0, 0);
        const foundInOld = oldQuery.find(c => c.mesh === mesh);
        assert.ok(!foundInOld, 'Should not be found in old spatial cell');

        // New position query
        const newQuery = colliderSystem.spatialHash.query(200, 0);
        const found = newQuery.find(c => c.mesh === mesh);
        assert.ok(found, 'Should be found at new position');
    });

    it('should remove colliders', () => {
        colliderSystem.clear();
        const mesh = new THREE.Mesh();
        const box = new THREE.Box3();
        colliderSystem.addStatic([{ mesh, box }]);

        assert.equal(colliderSystem.staticColliders.length, 1);

        colliderSystem.remove(mesh);

        assert.equal(colliderSystem.staticColliders.length, 0);
        // Verify spatial hash is clean
        // We can't query everything easily without knowing keys, but random query shouldn't find it
        // Or check internal map size if we could.
    });
});
