import { test, describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';
import { ColliderSystem } from './colliders.js';

// Setup Mock Data
const mockBox = new THREE.Box3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(10, 10, 10)
);

const mockMesh = new THREE.Mesh(
    new THREE.BoxGeometry(10, 10, 10),
    new THREE.MeshBasicMaterial()
);
mockMesh.position.set(5, 5, 5);
mockMesh.updateMatrixWorld(true);

describe('ColliderSystem', () => {
    let system;

    beforeEach(() => {
        system = new ColliderSystem();
    });

    it('should instantiate correctly', () => {
        assert.ok(system);
        assert.ok(system.spatialHash);
        assert.strictEqual(system.staticColliders.length, 0);
    });

    it('should add static colliders', () => {
        const collider = { mesh: mockMesh, box: mockBox };
        system.addStatic([collider]);

        assert.strictEqual(system.staticColliders.length, 1);

        // Verify SpatialHash insertion (chunk size 100, pos 0-10 is in 0,0)
        const nearby = system.spatialHash.query(5, 5);
        assert.ok(nearby.length > 0);
        assert.strictEqual(nearby[0].mesh, mockMesh);
    });

    it('should remove static colliders', () => {
        const collider = { mesh: mockMesh, box: mockBox };
        system.addStatic([collider]);
        system.remove(mockMesh);

        assert.strictEqual(system.staticColliders.length, 0);

        const nearby = system.spatialHash.query(5, 5);
        assert.strictEqual(nearby.length, 0);
    });

    it('should update body (re-index in spatial hash)', () => {
        const collider = { mesh: mockMesh, box: mockBox.clone() };
        system.addStatic([collider]);

        // Move mesh far away
        mockMesh.position.set(500, 0, 500);
        mockMesh.updateMatrixWorld(true);

        system.updateBody(mockMesh);

        // Should NOT be at old position
        const oldPos = system.spatialHash.query(5, 5);
        assert.strictEqual(oldPos.length, 0);

        // Should be at new position
        const newPos = system.spatialHash.query(500, 500);
        assert.ok(newPos.length > 0);
        assert.strictEqual(newPos[0].mesh, mockMesh);

        // Reset mesh position for other tests
        mockMesh.position.set(5, 5, 5);
        mockMesh.updateMatrixWorld(true);
    });

    it('should detect collision (Hit)', () => {
        const collider = { mesh: mockMesh, box: mockBox };
        system.addStatic([collider]);

        const dronePos = new THREE.Vector3(5, 5, 5); // Inside box
        const radius = 1.0;

        const hits = system.checkCollisions(dronePos, radius);
        assert.ok(hits.length > 0);
        assert.strictEqual(hits[0].object.mesh, mockMesh);
        assert.ok(hits[0].penetration > 0);
    });

    it('should not detect collision (Miss)', () => {
        const collider = { mesh: mockMesh, box: mockBox };
        system.addStatic([collider]);

        const dronePos = new THREE.Vector3(50, 50, 50); // Far away
        const radius = 1.0;

        const hits = system.checkCollisions(dronePos, radius);
        // Might hit ground if y < radius, so let's check explicitly for mesh
        const meshHit = hits.find(h => h.object.mesh === mockMesh);
        assert.strictEqual(meshHit, undefined);
    });

    it('should detect ground collision', () => {
        const dronePos = new THREE.Vector3(0, 0.5, 0); // y < radius (1.0)
        const radius = 1.0;

        const hits = system.checkCollisions(dronePos, radius);
        const groundHit = hits.find(h => h.object.type === 'ground');

        assert.ok(groundHit);
        assert.strictEqual(groundHit.penetration, 0.5); // 1.0 - 0.5
    });

    it('should clear all colliders', () => {
        const collider = { mesh: mockMesh, box: mockBox };
        system.addStatic([collider]);
        system.clear();

        assert.strictEqual(system.staticColliders.length, 0);
        const nearby = system.spatialHash.query(5, 5);
        assert.strictEqual(nearby.length, 0);
    });

    it('should handle dynamic colliders', () => {
        const dynamicBox = new THREE.Box3(
            new THREE.Vector3(100, 0, 0),
            new THREE.Vector3(110, 10, 10)
        );
        const dynamicMesh = new THREE.Mesh(
            new THREE.BoxGeometry(10, 10, 10),
            new THREE.MeshBasicMaterial()
        );
        dynamicMesh.position.set(105, 5, 5);
        dynamicMesh.updateMatrixWorld(true);
        // Ensure geometry has bounding box for recursive check
        dynamicMesh.geometry.computeBoundingBox();

        const dynamicObj = { mesh: dynamicMesh, box: dynamicBox };

        const dronePos = new THREE.Vector3(105, 5, 5);
        const radius = 1.0;

        const hits = system.checkCollisions(dronePos, radius, [dynamicObj]);

        assert.ok(hits.length > 0);
        assert.strictEqual(hits[0].object.mesh, dynamicMesh);
    });
});
