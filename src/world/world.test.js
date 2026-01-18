import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';
import { World } from './world.js';
import { EntityRegistry } from './entities/registry.js';
import { BaseEntity } from './entities/base.js';

// Setup Mock Entity
class MockEntity extends BaseEntity {
    constructor(params) {
        super(params);
        this.type = 'mock_entity';
    }
    createMesh(params) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial());
        return mesh;
    }
}

describe('World', () => {
    let scene;
    let world;

    beforeEach(() => {
        // Ensure clean registry
        EntityRegistry.registry.clear();
        EntityRegistry.register('mock_entity', MockEntity);

        scene = new THREE.Scene();
        // Mock add/remove to avoid errors if they do internal checks
        scene.add = mock.fn();
        scene.remove = mock.fn();

        // Suppress console.warn for missing sky_garden_tower during init
        mock.method(console, 'warn', () => {});

        world = new World(scene);
    });

    afterEach(() => {
        mock.reset();
    });

    it('should initialize correctly', () => {
        assert.ok(world.birdSystem);
        assert.ok(world.lightSystem);
        assert.ok(world.instancer);
        assert.ok(world.timeCycle);
        assert.strictEqual(world.colliders.length, 0);
        // Ground init should add to scene
        // We look for calls where the argument has geometry (Mesh)
        const addCalls = scene.add.mock.calls;
        const groundAdded = addCalls.some(call => call.arguments[0].geometry && call.arguments[0].geometry.type === 'PlaneGeometry');
        assert.ok(groundAdded, 'Ground should be added to scene');
    });

    it('should add an entity', () => {
        const entity = EntityRegistry.create('mock_entity', { x: 10, z: 10 });
        world.addEntity(entity);

        assert.strictEqual(world.colliders.length, 1);
        assert.strictEqual(world.colliders[0], entity);

        // Mock entity shouldn't be updatable unless it overrides update
        assert.strictEqual(world.updatables.length, 0);
    });

    it('should remove an entity', () => {
        const entity = EntityRegistry.create('mock_entity', { x: 10, z: 10 });
        world.addEntity(entity);
        world.removeEntity(entity);

        assert.strictEqual(world.colliders.length, 0);
    });

    it('should load map data', () => {
        const mapData = {
            objects: [
                { type: 'mock_entity', position: { x: 5, y: 0, z: 5 }, rotation: { x: 0, y: 1, z: 0 } }
            ],
            environment: { startTime: 10 }
        };

        world.loadMap(mapData);

        // Verify Environment
        assert.strictEqual(world.timeCycle.time, 10);

        // Verify Entity
        assert.strictEqual(world.colliders.length, 1);
        const entity = world.colliders[0];
        assert.strictEqual(entity.type, 'mock_entity');
        assert.strictEqual(entity.mesh.position.x, 5);
        // Rotation check (Euler to expected value)
        assert.strictEqual(entity.mesh.rotation.y, 1);

        // Verify scene.add called (via fallback)
        // Note: loadMap clears world first, so previous scene.add calls might be irrelevant if mocked fresh
        // but here we reuse the mock.
        // We expect at least one add call for the entity mesh.
        const addCalls = scene.add.mock.calls;
        const entityAdded = addCalls.some(call => call.arguments[0] === entity.mesh);
        assert.ok(entityAdded, 'Entity mesh should be added to scene');
    });

    it('should export map data', () => {
         const entity = EntityRegistry.create('mock_entity', { x: 10, y: 2, z: 10 });
         // Create mesh is handled by create
         entity.mesh.rotation.y = 1.5;

         // Manually link generic params
         entity.mesh.userData.params = { x: 10, y: 2, z: 10 };

         world.addEntity(entity);

         const data = world.exportMap();
         assert.ok(data.objects);
         assert.strictEqual(data.objects.length, 1);
         assert.strictEqual(data.objects[0].type, 'mock_entity');
         assert.strictEqual(data.objects[0].position.x, 10);
         assert.strictEqual(data.objects[0].rotation.y, 1.5);

         assert.ok(data.environment);
    });

    it('should clear the world', () => {
         const entity = EntityRegistry.create('mock_entity', { x: 10, y: 2, z: 10 });
         // Simulate adding to scene as loadMap would
         world.scene.add(entity.mesh);
         world.addEntity(entity);

         world.clear();

         assert.strictEqual(world.colliders.length, 0);

         // Verify removal
         const removeCalls = scene.remove.mock.calls;
         const entityRemoved = removeCalls.some(call => call.arguments[0] === entity.mesh);
         assert.ok(entityRemoved, 'Entity mesh should be removed from scene');
    });
});
