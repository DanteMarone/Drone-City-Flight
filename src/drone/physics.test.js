import { describe, it, beforeEach } from 'node:test';
import { strict as assert } from 'node:assert';
import * as THREE from 'three';
import { PhysicsEngine } from './physics.js';
import { CONFIG } from '../config.js';

// Mock ColliderSystem
class MockColliderSystem {
    constructor() {
        this.hits = [];
    }

    setHits(hits) {
        this.hits = hits;
    }

    checkCollisions(position, radius, dynamicColliders) {
        return this.hits;
    }
}

describe('PhysicsEngine', () => {
    let physicsEngine;
    let mockColliderSystem;
    let drone;

    beforeEach(() => {
        mockColliderSystem = new MockColliderSystem();
        physicsEngine = new PhysicsEngine(mockColliderSystem);

        // Mock Drone object
        drone = {
            position: new THREE.Vector3(0, 10, 0),
            velocity: new THREE.Vector3(0, 0, 0)
        };
    });

    it('should not modify drone when no collisions occur', () => {
        mockColliderSystem.setHits([]); // No hits

        const initialPos = drone.position.clone();
        const initialVel = drone.velocity.clone();

        const result = physicsEngine.resolveCollisions(drone, []);

        assert.equal(result, false, 'Should return false when no collision');
        assert.ok(drone.position.equals(initialPos), 'Position should not change');
        assert.ok(drone.velocity.equals(initialVel), 'Velocity should not change');
    });

    it('should correct position when penetration occurs', () => {
        const hit = {
            penetration: 0.5,
            normal: new THREE.Vector3(-1, 0, 0)
        };
        mockColliderSystem.setHits([hit]);

        const initialPos = drone.position.clone();

        const result = physicsEngine.resolveCollisions(drone, []);

        assert.equal(result, true, 'Should return true on collision');

        const expectedPos = initialPos.clone().add(new THREE.Vector3(-0.5, 0, 0));

        assert.ok(drone.position.equals(expectedPos), `Position should be corrected. Got ${drone.position.toArray()}`);
    });

    it('should bounce velocity when hitting a wall', () => {
        drone.velocity.set(10, 0, 0);

        const hit = {
            penetration: 0,
            normal: new THREE.Vector3(-1, 0, 0)
        };
        mockColliderSystem.setHits([hit]);

        physicsEngine.resolveCollisions(drone, []);

        assert.equal(drone.velocity.x, -5, 'Should bounce back with half speed');
        assert.equal(drone.velocity.y, 0);
        assert.equal(drone.velocity.z, 0);
    });

    it('should apply friction to tangential velocity', () => {
        drone.velocity.set(10, 0, 10);

        const hit = {
            penetration: 0,
            normal: new THREE.Vector3(-1, 0, 0)
        };
        mockColliderSystem.setHits([hit]);

        physicsEngine.resolveCollisions(drone, []);

        assert.equal(drone.velocity.x, -5, 'Normal component should bounce');

        // Expected Z = 10 * 0.9 = 9
        assert.ok(Math.abs(drone.velocity.z - 9) < 0.001, `Tangential component should include friction. Got ${drone.velocity.z}, expected 9`);
    });
});
