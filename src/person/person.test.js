import * as THREE from 'three';
import { strict as assert } from 'assert';
import { Person } from './person.js';
import { CONFIG } from '../config.js';

// Test Helper (Minimal runner)
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

async function it(name, fn) {
    try {
        await fn();
        console.log(`  ✅ ${name}`);
    } catch (e) {
        console.error(`  ❌ ${name}`);
        console.error(e);
        throw e;
    }
}

// Mocks
class MockCharacter {
    constructor() {
        this.isLoaded = false;
        this.callLog = [];
    }

    async load(options) {
        this.isLoaded = true;
        this.callLog.push({ method: 'load', args: options });
        return new THREE.Group();
    }

    playAnimation(name, options) {
        this.callLog.push({ method: 'playAnimation', name, options });
    }

    update(dt) {
        this.callLog.push({ method: 'update', dt });
    }

    loaded() {
        return this.isLoaded;
    }

    dispose() {}
}

const mockScene = {
    add: () => {},
    remove: () => {}
};

const mockColliderSystem = {
    hits: [],
    checkCollisions: function(pos, radius, dynamic) {
        return this.hits;
    }
};

describe('Person Entity', () => {

    it('should initialize with default values', () => {
        const person = new Person(mockScene, false); // No FBX for simple init check
        assert.ok(person.position instanceof THREE.Vector3);
        assert.ok(person.velocity instanceof THREE.Vector3);
        assert.equal(person.grounded, false);
    });

    it('should use provided CharacterClass and load FBX', async () => {
        const person = new Person(mockScene, true, MockCharacter);

        // Wait for async load to complete (it's called in constructor but async)
        // Give it a tiny bit of time for the promise chain to resolve
        await new Promise(resolve => setTimeout(resolve, 10));

        assert.ok(person.fbxCharacter instanceof MockCharacter);
        assert.ok(person.fbxCharacter.loaded());
        assert.equal(person.fbxCharacter.callLog.some(c => c.method === 'load'), true);
        assert.equal(person.fbxCharacter.callLog.some(c => c.method === 'playAnimation' && c.name === 'idle'), true);
    });

    it('should handle gravity', () => {
        const person = new Person(mockScene, false);
        person.position.set(0, 100, 0);

        const dt = 0.1;
        const input = { x: 0, z: 0, jump: false, yaw: 0 };
        const initialVy = person.velocity.y;

        person.update(dt, input, mockColliderSystem);

        // Gravity is negative, so velocity should decrease
        assert.ok(person.velocity.y < initialVy, `Velocity Y (${person.velocity.y}) should be less than initial (${initialVy})`);
    });

    it('should handle movement input', () => {
        const person = new Person(mockScene, false);
        const dt = 0.1;
        const input = { x: 1, z: 0, jump: false, yaw: 0 }; // Moving Right

        person.update(dt, input, mockColliderSystem);

        assert.ok(person.velocity.x > 0, 'Velocity X should increase when moving right');
    });

    it('should handle jumping when grounded', () => {
        const person = new Person(mockScene, false);
        person.grounded = true;
        const input = { x: 0, z: 0, jump: true, yaw: 0 };
        const dt = 0.016;

        person.update(dt, input, mockColliderSystem);

        assert.equal(person.grounded, false, 'Should not be grounded after jump start');
        assert.ok(person.velocity.y > 0, 'Should have positive upward velocity');

        // Velocity is set to JUMP_SPEED then gravity is applied immediately
        const expectedVy = CONFIG.PERSON.JUMP_SPEED + (CONFIG.PERSON.GRAVITY * dt);
        assert.ok(Math.abs(person.velocity.y - expectedVy) < 0.001, `Should match jump speed adjusted for gravity frame (Expected ${expectedVy}, Got ${person.velocity.y})`);
    });

    it('should NOT jump when not grounded', () => {
        const person = new Person(mockScene, false);
        person.grounded = false;
        const input = { x: 0, z: 0, jump: true, yaw: 0 };
        const dt = 0.016;

        person.update(dt, input, mockColliderSystem);

        // Velocity Y should decrease due to gravity, not jump
        assert.ok(person.velocity.y < 0, 'Should fall (gravity) not jump');
    });

    it('should handle collision grounding', () => {
        const person = new Person(mockScene, false);
        person.position.set(0, 0.5, 0); // Low
        person.velocity.y = -10; // Falling fast

        // Setup collision hit
        mockColliderSystem.hits = [{
            penetration: 0.1,
            normal: new THREE.Vector3(0, 1, 0), // Upwards normal (ground)
            object: { type: 'ground' }
        }];

        const dt = 0.016;
        person.update(dt, {}, mockColliderSystem);

        assert.ok(person.grounded, 'Should be grounded after hitting ground');
        // Velocity reflection logic depends on implementation, but typically it shouldn't be falling anymore
        // Logic: if (vDotN < 0) this.velocity.add(hit.normal.clone().multiplyScalar(-vDotN));
        // So velocity in normal direction becomes 0 (or bounces if restitution > 0, but here it looks like slide/stop)
        assert.ok(person.velocity.y >= 0, 'Vertical velocity should be corrected (not falling)');

        // Reset hits
        mockColliderSystem.hits = [];
    });

    it('should trigger animation changes', async () => {
         const person = new Person(mockScene, true, MockCharacter);
         await new Promise(r => setTimeout(r, 10)); // wait for load

         const char = person.fbxCharacter;
         char.callLog = []; // Clear log

         // 1. Walk
         const inputWalk = { x: 1, z: 0 };
         person.update(0.1, inputWalk, mockColliderSystem);

         assert.ok(char.callLog.some(c => c.method === 'playAnimation' && c.name === 'walking'), 'Should play walking');
         char.callLog = [];

         // 2. Stop Walking (Idle)
         const inputIdle = { x: 0, z: 0 };
         person.update(0.1, inputIdle, mockColliderSystem);
         assert.ok(char.callLog.some(c => c.method === 'playAnimation' && c.name === 'idle'), 'Should play idle');
         char.callLog = [];

         // 3. Jump
         person.grounded = true;
         person.wasGrounded = true;
         const inputJump = { jump: true };
         person.update(0.1, inputJump, mockColliderSystem);

         assert.ok(char.callLog.some(c => c.method === 'playAnimation' && c.name === 'standingJump'), 'Should play standingJump');
    });
});
