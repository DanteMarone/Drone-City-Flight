
import { describe, it } from 'node:test';
import { strict as assert } from 'assert';
import { ColliderSystem } from './colliders.js';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// Test Helpers
// -----------------------------------------------------------------------------

function createMesh(x, y, z, size = 1) {
    const geo = new THREE.BoxGeometry(size, size, size);
    geo.computeBoundingBox();
    const mesh = new THREE.Mesh(geo);
    mesh.position.set(x, y, z);
    mesh.updateMatrixWorld();

    // Create the wrapper expected by ColliderSystem
    const box = new THREE.Box3().copy(geo.boundingBox).applyMatrix4(mesh.matrixWorld);
    return { mesh, box, type: 'box' };
}

function createRing(x, y, z) {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.2));
    mesh.position.set(x, y, z);
    mesh.updateMatrixWorld();
    const box = new THREE.Box3().setFromObject(mesh);
    return { mesh, box, type: 'ring' };
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('ColliderSystem', () => {

    describe('Initialization', () => {
        it('should create dependencies correctly', () => {
            const sys = new ColliderSystem();
            assert(sys.staticColliders.length === 0, 'Should start empty');
            assert(sys.spatialHash, 'SpatialHash should be initialized');
            assert(sys.spatialHash.cellSize === 100, 'SpatialHash cell size should match CONFIG');
        });
    });

    describe('SpatialHash Integration', () => {
        it('should insert and query objects', () => {
            const sys = new ColliderSystem();
            const obj = createMesh(10, 50, 10, 2);
            sys.addStatic([obj]);

            const nearby = sys.spatialHash.query(10, 10);
            assert.equal(nearby.length, 1, 'Should find object in cell');
            assert.strictEqual(nearby[0], obj, 'Should return the correct object');
        });

        it('should handle negative coordinates', () => {
            const sys = new ColliderSystem();
            const obj = createMesh(-50, 50, -50, 2);
            sys.addStatic([obj]);

            const nearby = sys.spatialHash.query(-50, -50);
            assert.equal(nearby.length, 1, 'Should find object at negative coordinates');
            assert.strictEqual(nearby[0], obj);
        });
    });

    describe('Lifecycle Management', () => {
        it('should remove objects', () => {
            const sys = new ColliderSystem();
            const obj = createMesh(10, 50, 10, 2);
            sys.addStatic([obj]);

            assert.equal(sys.spatialHash.query(10, 10).length, 1);

            sys.remove(obj.mesh);

            assert.equal(sys.staticColliders.length, 0, 'Should be removed from list');
            assert.equal(sys.spatialHash.query(10, 10).length, 0, 'Should be removed from SpatialHash');
        });

        it('should update object position in SpatialHash', () => {
            const sys = new ColliderSystem();
            const obj = createMesh(10, 50, 10, 2);
            sys.addStatic([obj]);

            // Move object to new cell
            obj.mesh.position.set(200, 50, 200);
            obj.mesh.updateMatrixWorld();

            // Call updateBody
            sys.updateBody(obj.mesh);

            // Verify old cell is empty
            assert.equal(sys.spatialHash.query(10, 10).length, 0, 'Should vacate old cell');

            // Verify new cell has object
            assert.equal(sys.spatialHash.query(200, 200).length, 1, 'Should occupy new cell');

            // Verify collision box updated
            // Check collisions at new position
            const hits = sys.checkCollisions(new THREE.Vector3(200, 50, 200), 0.5);
            assert.equal(hits.length, 1, 'Should detect collision at new position');
        });
    });

    describe('Collision Logic', () => {
        const y = 50; // Use high altitude to avoid ground collision

        it('Sphere vs Box (Hit)', () => {
            const sys = new ColliderSystem();
            const obj = createMesh(0, y, 0, 2);
            sys.addStatic([obj]);

            // Sphere at (1.5, 50, 0), Radius 1.0. Box edge at 1.0.
            const hits = sys.checkCollisions(new THREE.Vector3(1.5, y, 0), 1.0);

            assert.equal(hits.length, 1);
            assert.strictEqual(hits[0].object, obj);
            assert(Math.abs(hits[0].penetration - 0.5) < 0.001);
        });

        it('Sphere vs Box (Miss)', () => {
            const sys = new ColliderSystem();
            const obj = createMesh(0, y, 0, 2);
            sys.addStatic([obj]);

            const hits = sys.checkCollisions(new THREE.Vector3(3.0, y, 0), 1.0);
            assert.equal(hits.length, 0);
        });

        it('Sphere vs Ring (Rim Hit)', () => {
            const sys = new ColliderSystem();
            const ring = createRing(0, y, 0);
            sys.addStatic([ring]);

            // Hit rim at (1.5, y+0.5, 0)
            const hits = sys.checkCollisions(new THREE.Vector3(1.5, y + 0.5, 0), 0.4);
            assert(hits.length > 0);
            assert.strictEqual(hits[0].object.type, 'ring');
        });

        it('Sphere vs Ring (Center Pass)', () => {
            const sys = new ColliderSystem();
            const ring = createRing(0, y, 0);
            sys.addStatic([ring]);

            const hits = sys.checkCollisions(new THREE.Vector3(0, y, 0), 0.5);
            assert.equal(hits.length, 0);
        });

        it('Ground Plane', () => {
            const sys = new ColliderSystem();
            const hits = sys.checkCollisions(new THREE.Vector3(0, 0.5, 0), 1.0);

            assert.equal(hits.length, 1);
            assert.strictEqual(hits[0].object.type, 'ground');
        });

        it('Hierarchical Mesh Collision', () => {
            const sys = new ColliderSystem();
            const group = new THREE.Group();
            const geo = new THREE.BoxGeometry(2, 2, 2);
            geo.computeBoundingBox();
            const mesh = new THREE.Mesh(geo);
            mesh.position.set(0, 2, 0);
            group.add(mesh);

            group.position.set(0, y, 0);
            group.updateMatrixWorld();

            const box = new THREE.Box3().setFromObject(group);
            const collider = { mesh: group, box, type: 'entity' };

            sys.addStatic([collider]);

            const hits = sys.checkCollisions(new THREE.Vector3(0, y + 2, 0), 0.5);

            assert(hits.length > 0);
            assert.strictEqual(hits[0].object, collider);
        });
    });
});
