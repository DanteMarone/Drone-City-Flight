
import * as THREE from 'three';
import { strict as assert } from 'assert';
import { BirdSystem } from './birdSystem.js';
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

// Mock Drone
class MockDrone {
    constructor() {
        this.mesh = {
            position: new THREE.Vector3()
        };
        this.battery = {
            current: 100
        };
    }
}

// Mock Bird Mesh
class MockBirdMesh {
    constructor(startPos = new THREE.Vector3()) {
        this.position = startPos.clone();
        this.userData = {
            startPos: startPos.clone(),
            wings: { position: new THREE.Vector3() },
            waypoints: []
        };
        this.up = new THREE.Vector3(0, 1, 0);
        this.quaternion = new THREE.Quaternion();
        this.matrix = new THREE.Matrix4();
        this.matrixWorld = new THREE.Matrix4();
    }

    lookAt(target) {
        // Minimal stub to prevent crash
        // In real Three.js, this updates quaternion based on target
    }
}

// -----------------------------------------------------------------------------
// Suite: BirdSystem
// -----------------------------------------------------------------------------
describe('BirdSystem', () => {

    it('should initialize and add birds', () => {
        const system = new BirdSystem({}); // Mock scene as empty obj
        const birdMesh = new MockBirdMesh(new THREE.Vector3(0, 10, 0));

        system.add(birdMesh);

        assert.equal(system.birds.length, 1);
        assert.equal(system.birds[0].state, 'PATROL');
        assert.equal(system.birds[0].mesh, birdMesh);
    });

    it('should transition PATROL -> CHASE when drone is close', () => {
        const system = new BirdSystem({});
        const drone = new MockDrone();
        system.setDrone(drone);

        const startPos = new THREE.Vector3(100, 10, 100);
        const birdMesh = new MockBirdMesh(startPos);
        system.add(birdMesh);

        // Drone is at 0,0,0. Bird at 100,10,100. Dist ~141.
        // CHASE_RADIUS is 50. Should be PATROL.
        system.update(0.1);
        assert.equal(system.birds[0].state, 'PATROL', 'Should remain in PATROL when far');

        // Move drone close
        drone.mesh.position.set(90, 10, 100); // Dist 10.
        system.update(0.1);
        assert.equal(system.birds[0].state, 'CHASE', 'Should switch to CHASE when close');
        // ResumePos should be set
        const bird = system.birds[0];
        assert.ok(bird.resumePos.distanceTo(startPos) < 0.001, 'Should save resume position');
    });

    it('should transition CHASE -> RETURN when drone escapes', () => {
        const system = new BirdSystem({});
        const drone = new MockDrone();
        system.setDrone(drone);

        const birdMesh = new MockBirdMesh(new THREE.Vector3(0, 10, 0));
        system.add(birdMesh);

        // Force into CHASE
        system.birds[0].state = 'CHASE';
        system.birds[0].resumePos.set(0, 10, 0);

        // Move drone far away
        drone.mesh.position.set(1000, 10, 1000);

        system.update(0.1);
        assert.equal(system.birds[0].state, 'RETURN', 'Should switch to RETURN when far');
    });

    it('should transition RETURN -> PATROL when back at start', () => {
        const system = new BirdSystem({});
        const drone = new MockDrone(); // Far away
        drone.mesh.position.set(1000, 0, 0);
        system.setDrone(drone);

        const startPos = new THREE.Vector3(0, 10, 0);
        const birdMesh = new MockBirdMesh(startPos);

        // Start bird away from home
        birdMesh.position.set(50, 10, 50);

        system.add(birdMesh);
        const bird = system.birds[0];

        // Force RETURN state
        bird.state = 'RETURN';
        bird.resumePos.copy(startPos);

        // Update loop to move bird close
        // We can jump the bird close to test the transition
        birdMesh.position.set(0.5, 10, 0); // Within 1.0 unit

        system.update(0.1);
        assert.equal(bird.state, 'PATROL', 'Should switch to PATROL when close to resumePos');
        assert.ok(birdMesh.position.distanceTo(startPos) < 0.001, 'Should snap to resumePos');
    });

    it('should move towards target', () => {
        const system = new BirdSystem({});
        const drone = new MockDrone();
        drone.mesh.position.set(0, 10, 0);
        system.setDrone(drone);

        // Bird at (10, 10, 0)
        const birdMesh = new MockBirdMesh(new THREE.Vector3(10, 10, 0));
        system.add(birdMesh);
        const bird = system.birds[0];

        // CHASE state: target is drone (0, 10, 0)
        bird.state = 'CHASE';

        const prevDist = birdMesh.position.distanceTo(drone.mesh.position);
        system.update(0.1); // 0.1 sec
        const newDist = birdMesh.position.distanceTo(drone.mesh.position);

        assert.ok(newDist < prevDist, 'Should move closer to target');

        // Check speed approx
        // CONFIG.BIRD.SPEED is 16.0. dt=0.1. Move ~1.6.
        const moved = prevDist - newDist;
        assert.ok(Math.abs(moved - 1.6) < 0.1, `Should move approx 1.6 units, moved ${moved}`);
    });

    it('should drain battery when attacking', () => {
        const system = new BirdSystem({});
        const drone = new MockDrone();
        system.setDrone(drone);

        const birdMesh = new MockBirdMesh(new THREE.Vector3(0, 0, 0)); // At drone pos
        system.add(birdMesh);
        const bird = system.birds[0];

        // CHASE state and COLLISION (Dist < 1.0)
        bird.state = 'CHASE';
        drone.mesh.position.set(0, 0, 0);
        birdMesh.position.set(0.5, 0, 0); // Within 1.0

        const initialBattery = drone.battery.current;
        system.update(0.1);

        // CONFIG.BATTERY.DRAIN_COLLISION = 20.0
        // Expected loss: 2.0
        const expectedBattery = initialBattery - 2.0;

        assert.ok(Math.abs(drone.battery.current - expectedBattery) < 0.01, 'Should drain battery on collision');
    });

    it('should patrol waypoints', () => {
        const system = new BirdSystem({});
        const drone = new MockDrone();
        drone.mesh.position.set(1000,0,0); // Far away
        system.setDrone(drone);

        const startPos = new THREE.Vector3(0, 0, 0);
        const birdMesh = new MockBirdMesh(startPos);

        // Define waypoints
        const wp1 = new THREE.Vector3(10, 0, 0);
        const wp2 = new THREE.Vector3(20, 0, 0);
        birdMesh.userData.waypoints = [wp1, wp2];

        system.add(birdMesh);
        const bird = system.birds[0];

        // Should start heading to wp1 (index 0)
        assert.equal(bird.currentWaypointIndex, 0);

        // Teleport close to wp1 to trigger switch
        birdMesh.position.copy(wp1).sub(new THREE.Vector3(0.1, 0, 0)); // 0.1 units away

        system.update(0.1);

        // Should have switched to index 1
        assert.equal(bird.currentWaypointIndex, 1, 'Should advance to next waypoint');
    });
});
