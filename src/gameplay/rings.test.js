
import { describe, it, beforeEach } from 'node:test';
import { strict as assert } from 'assert';
import * as THREE from 'three';
import { RingManager } from './rings.js';

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------

class MockScene {
    constructor() {
        this.children = [];
    }
    add(obj) {
        this.children.push(obj);
        // Force matrix update so physics checks don't see it at 0,0,0
        obj.updateMatrixWorld();
    }
    remove(obj) {
        const idx = this.children.indexOf(obj);
        if (idx > -1) this.children.splice(idx, 1);
    }
}

class MockColliderSystem {
    constructor() {
        this.collisions = []; // Force specific collisions
    }
    checkCollisions(pos, radius) {
        return this.collisions;
    }
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('RingManager', () => {
    let scene, drone, colliderSystem, manager;

    beforeEach(() => {
        scene = new MockScene();
        // Move drone far away to prevent accidental collection of un-updated matrices
        drone = { position: new THREE.Vector3(9999, 9999, 9999) };
        colliderSystem = new MockColliderSystem();

        manager = new RingManager(scene, drone, colliderSystem);
    });

    it('should initialize and spawn first ring', () => {
        assert.equal(manager.rings.length, 1, 'Should have 1 ring initially');
        assert.equal(scene.children.length, 1, 'Should add ring to scene');
        assert.equal(manager.collectedCount, 0, 'Should start with 0 collected');
    });

    it('should spawn rings periodically', () => {
        // Initial: 1 ring
        manager.update(4.1); // > spawnInterval (4.0)
        assert.equal(manager.rings.length, 2, 'Should spawn 2nd ring after interval');
    });

    it('should limit max rings', () => {
        // Spawn 8 more (Total 9)
        for (let i = 0; i < 10; i++) {
            manager.update(4.1);
        }
        assert(manager.rings.length <= 9, 'Should not exceed 9 rings');
    });

    it('should retry spawning if collision occurs', () => {
        // Mock a collision for the first check
        let checks = 0;
        colliderSystem.checkCollisions = () => {
            checks++;
            if (checks === 1) return [{ object: {} }]; // Fail first
            return []; // Pass second
        };

        manager.spawnRing();
        // Should have called checkCollisions at least twice
        assert(checks >= 2, 'Should retry on collision');
        assert.equal(manager.rings.length, 2); // Initial + 1
    });

    it('should collect ring when drone flies through center', () => {
        const ring = manager.rings[0];

        // Force ring position/rotation for deterministic test
        ring.mesh.position.set(10, 10, 10);
        ring.mesh.rotation.set(0, 0, 0); // Facing Z
        ring.mesh.updateMatrixWorld(true);

        // 1. Drone Far away
        drone.position.set(0, 0, 0);
        assert.equal(manager.update(0.1), false, 'Should not collect far away');

        // 2. Drone in center (10, 10, 10)
        drone.position.set(10, 10, 10);
        assert.equal(manager.update(0.1), true, 'Should collect at center');

        assert.equal(manager.rings.length, 0, 'Ring should be removed');
        assert.equal(manager.collectedCount, 1, 'Score should increase');
        assert.equal(scene.children.length, 0, 'Mesh removed from scene');
    });

    it('should NOT collect ring if hitting the rim (outside hole)', () => {
        const ring = manager.rings[0];
        ring.mesh.position.set(10, 10, 10);
        ring.mesh.rotation.set(0, 0, 0); // XY Plane
        ring.mesh.updateMatrixWorld(true);

        // Hole radius ~1.3. Drone at (11.4, 10, 10) is 1.4 units from center (Hit Rim)
        drone.position.set(11.4, 10, 10);

        assert.equal(manager.update(0.1), false, 'Should not collect at rim');
        assert.equal(manager.rings.length, 1);
    });

    it('should clear all rings', () => {
        manager.spawnRing();
        assert.equal(manager.rings.length, 2);

        manager.clear();
        assert.equal(manager.rings.length, 0);
        assert.equal(scene.children.length, 0);
        assert.equal(manager.collectedCount, 0);
    });

    it('should load rings from data', () => {
        const data = [
            { position: { x: 1, y: 2, z: 3 }, rotation: { x: 0, y: 0, z: 0 } },
            { position: { x: 4, y: 5, z: 6 }, rotation: { x: 0, y: 0, z: 0 } }
        ];

        manager.loadRings(data);
        assert.equal(manager.rings.length, 2);
        assert.equal(manager.rings[0].mesh.position.x, 1);
        assert.equal(manager.rings[1].mesh.position.y, 5);
    });
});
