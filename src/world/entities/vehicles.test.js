
import * as THREE from 'three';
import { strict as assert } from 'assert';
import { VehicleEntity, PickupTruckEntity } from './vehicles.js';

// Minimal Test Runner
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

// Mock Entity Registry to avoid side effects or missing dependencies
// We assume VehicleEntity imports EntityRegistry, but we might need to mock it if it's used in constructor.
// Based on code, it's used at the end of file.

describe('VehicleEntity', () => {

    it('should initialize with waypoints', () => {
        const waypoints = [{ x: 10, y: 0, z: 10 }, { x: 20, y: 0, z: 20 }];
        const vehicle = new VehicleEntity({ waypoints });

        assert.equal(vehicle.waypoints.length, 2);
        assert.ok(vehicle.waypoints[0] instanceof THREE.Vector3);
        assert.equal(vehicle.waypoints[0].x, 10);
    });

    it('should setup mesh userData in postInit', () => {
        const vehicle = new VehicleEntity({});

        // Mock Mesh structure
        const mesh = new THREE.Group();
        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';
        mesh.add(modelGroup);

        vehicle.mesh = mesh;
        vehicle.postInit();

        assert.ok(vehicle.mesh.userData.isVehicle, 'Should mark as vehicle');
        assert.ok(vehicle.mesh.userData.waypoints, 'Should attach waypoints');
        assert.equal(vehicle.mesh.userData.targetIndex, 1, 'Should start targeting first waypoint (index 1)');
    });

    it('should move towards target in update', () => {
        const startPos = new THREE.Vector3(0, 0, 0);
        const targetPos = new THREE.Vector3(10, 0, 0);
        const vehicle = new VehicleEntity({ waypoints: [targetPos] });

        // Setup Mesh
        const mesh = new THREE.Group();
        mesh.position.copy(startPos);
        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';
        mesh.add(modelGroup);
        vehicle.mesh = mesh;
        vehicle.postInit();

        vehicle.baseSpeed = 1.0;
        const dt = 1.0; // Move 1 unit

        vehicle.update(dt);

        // Logic:
        // 1. target is waypoints[0] (10,0,0)
        // 2. mesh is at (0,0,0)
        // 3. localTarget = worldToLocal(10,0,0) -> (10,0,0) (since mesh is at 0,0,0 identity)
        // 4. currentLocal = modelGroup.position (0,0,0)
        // 5. dir = (1,0,0)
        // 6. modelGroup.position += (1,0,0) * 1.0 = (1,0,0)

        const pos = modelGroup.position;
        assert.ok(Math.abs(pos.x - 1.0) < 0.001, 'Should move 1 unit in X');
        assert.ok(Math.abs(pos.y) < 0.001);
        assert.ok(Math.abs(pos.z) < 0.001);
    });

    it('should reach waypoint and increment target', () => {
        const vehicle = new VehicleEntity({ waypoints: [{ x: 2, y: 0, z: 0 }, { x: 4, y: 0, z: 0 }] });

        // Setup Mesh
        const mesh = new THREE.Group();
        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';
        mesh.add(modelGroup);
        vehicle.mesh = mesh;
        vehicle.postInit();

        vehicle.baseSpeed = 10.0;
        const dt = 1.0;
        // Dist to 1st waypoint (2,0,0) is 2. Speed*dt = 10. Overshoot.
        // Should snap to 2,0,0 and increment index.

        vehicle.update(dt);

        assert.equal(modelGroup.position.x, 2, 'Should snap to waypoint');
        assert.equal(vehicle.mesh.userData.targetIndex, 2, 'Should increment to next target');
    });

    it('should loop waypoints by default', () => {
        // Points: Start(0,0,0) -> WP1(2,0,0) -> WP2(4,0,0) -> Loop back to Start
        // Note: Total points = 1 + waypoints.length = 3.
        // Indices: 0(Start), 1(WP1), 2(WP2).

        const vehicle = new VehicleEntity({ waypoints: [{ x: 2, y: 0, z: 0 }] });
        // Points: Start(0), WP1(2). Total 2. Indices 0, 1.

        const mesh = new THREE.Group();
        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';
        mesh.add(modelGroup);
        vehicle.mesh = mesh;
        vehicle.postInit();

        // At start, targetIndex = 1 (WP1)
        vehicle.baseSpeed = 100.0; // Instant arrive

        // Move to WP1
        vehicle.update(0.1);
        assert.equal(modelGroup.position.x, 2);
        assert.equal(vehicle.mesh.userData.targetIndex, 0, 'Should loop back to start (index 0)');

        // Move to Start
        vehicle.update(0.1);
        assert.equal(modelGroup.position.x, 0);
        assert.equal(vehicle.mesh.userData.targetIndex, 1, 'Should target WP1 again');
    });
});

describe('PickupTruckEntity', () => {
    it('should initialize with default waitTime', () => {
        const truck = new PickupTruckEntity({});
        assert.equal(truck.waitTime, 10);
        assert.equal(truck.direction, 1);
    });

    it('should ping-pong at endpoints', () => {
        // Points: Start(0), WP1(2). Total 2. Indices 0, 1.
        const truck = new PickupTruckEntity({ waypoints: [{ x: 2, y: 0, z: 0 }], waitTime: 0 }); // Zero wait for easier test

        const mesh = new THREE.Group();
        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';
        mesh.add(modelGroup);
        truck.mesh = mesh;
        truck.postInit();

        truck.baseSpeed = 100.0;

        // 1. Move to WP1 (Index 1) - End of line
        truck.update(0.1);
        assert.equal(modelGroup.position.x, 2);

        // Logic check:
        // atForwardEnd = targetIdx(1) >= totalPoints(2)-1(1) -> True.
        // direction becomes -1.
        // nextIdx = 1 + (-1) = 0.

        assert.equal(truck.direction, -1, 'Should reverse direction');
        assert.equal(truck.mesh.userData.targetIndex, 0, 'Should target start');

        // 2. Move to Start (Index 0) - Start of line
        truck.update(0.1);
        assert.equal(modelGroup.position.x, 0);

        // Logic check:
        // atBackwardEnd = targetIdx(0) <= 0 -> True.
        // direction becomes 1.
        // nextIdx = 0 + 1 = 1.

        assert.equal(truck.direction, 1, 'Should reverse direction again');
        assert.equal(truck.mesh.userData.targetIndex, 1, 'Should target WP1');
    });

    it('should wait at endpoints', () => {
        const truck = new PickupTruckEntity({ waypoints: [{ x: 2, y: 0, z: 0 }], waitTime: 5 });

        const mesh = new THREE.Group();
        const modelGroup = new THREE.Group();
        modelGroup.name = 'modelGroup';
        mesh.add(modelGroup);
        truck.mesh = mesh;
        truck.postInit();
        truck.baseSpeed = 100.0;

        // 1. Arrive at WP1
        truck.update(0.1);
        assert.equal(modelGroup.position.x, 2);
        assert.equal(truck.waitTimer, 5, 'Should set wait timer');

        // 2. Update while waiting
        truck.update(2.0); // Wait 2s
        assert.equal(truck.waitTimer, 3, 'Should decrease timer');
        assert.equal(modelGroup.position.x, 2, 'Should not move');

        // 3. Finish waiting
        // Reduce speed so it doesn't instantly arrive at the other end (Start) and reset the timer again
        truck.baseSpeed = 0.5;

        truck.update(3.1); // Wait remaining 3s + 0.1s. Move 0.1s * 0.5 = 0.05 units.

        assert.equal(truck.waitTimer, 0, 'Timer should clear');

        // Should have moved slightly back towards 0 (Start)
        // Current X was 2. Moving to 0. Should be < 2.
        assert.ok(modelGroup.position.x < 2, 'Should start moving after wait');
        // Check it didn't go all the way to 0
        assert.ok(modelGroup.position.x > 0, 'Should not have arrived at start yet');
    });
});
