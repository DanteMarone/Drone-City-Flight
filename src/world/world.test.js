import { describe, it, beforeEach, afterEach, mock, before } from 'node:test';
import assert from 'node:assert';
import { World } from './world.js';
import * as THREE from 'three';

// Mock dependencies
// We can use a simple mock class for dependencies that World instantiates
// Or we can mock the imports if we need deeper control, but for now we'll rely on loose JS objects/mocks where possible.

describe('World', () => {
    let world;
    let mockScene;

    before(() => {
        // Mock global document and canvas for TextureGenerator
        if (typeof global.document === 'undefined') {
            global.document = {
                createElement: (tag) => {
                    if (tag === 'canvas') {
                        return {
                            getContext: () => ({
                                fillRect: () => {},
                                fillText: () => {},
                                measureText: () => ({ width: 0 }),
                                translate: () => {},
                                rotate: () => {},
                                beginPath: () => {},
                                arc: () => {},
                                fill: () => {},
                                stroke: () => {},
                                moveTo: () => {},
                                lineTo: () => {},
                                setTransform: () => {},
                                createLinearGradient: () => ({ addColorStop: () => {} }),
                                createRadialGradient: () => ({ addColorStop: () => {} }),
                                canvas: { width: 0, height: 0 }
                            }),
                            width: 0,
                            height: 0,
                            toDataURL: () => ''
                        };
                    }
                    return {};
                }
            };
        }
    });

    beforeEach(() => {
        mockScene = {
            add: mock.fn(),
            remove: mock.fn(),
        };

        // Create world instance
        // We'll rely on the real implementations of systems (BirdSystem, LightSystem, etc.)
        // being instantiated, but since we are in Node with no DOM/WebGL,
        // we might hit issues if they do heavy lifting in constructor.
        // World constructor calls:
        // - BirdSystem(scene)
        // - LightSystem(scene)
        // - InstancedEntitySystem(scene)
        // - TimeCycle()
        // - _initGround() -> creates THREE.Mesh
        // - _generateWorld() -> calls EntityRegistry.create

        // We need to ensure EntityRegistry doesn't crash or return something that breaks.
        // And THREE.Mesh needs to work (which it does in node usually).

        world = new World(mockScene);
    });

    afterEach(() => {
        // Cleanup if needed
        mock.reset();
        // We might want to clear the world if it keeps state
        if (world) world.clear();
    });

    describe('Initialization', () => {
        it('should initialize all subsystems', () => {
            assert.ok(world.birdSystem, 'BirdSystem should be initialized');
            assert.ok(world.lightSystem, 'LightSystem should be initialized');
            assert.ok(world.instancer, 'Instancer should be initialized');
            assert.ok(world.timeCycle, 'TimeCycle should be initialized');
        });

        it('should initialize empty lists', () => {
            // Note: _generateWorld adds a landmark, so colliders won't be empty by default
            // But we can check that they are arrays
            assert.ok(Array.isArray(world.colliders));
            assert.ok(Array.isArray(world.updatables));
            assert.ok(Array.isArray(world.landingPads));
        });

        it('should create ground', () => {
            assert.ok(world.ground);
            // World constructor adds multiple things:
            // 1. LightSystem adds maxLights (12) PointLights
            // 2. _initGround adds ground (1)
            // 3. _generateWorld adds landmark (1)
            // Total = 14
            assert.strictEqual(mockScene.add.mock.calls.length, 14);

            // Check if ground was added
            // Search through calls to find the ground mesh
            const groundCall = mockScene.add.mock.calls.find(call => call.arguments[0] === world.ground);
            assert.ok(groundCall, 'Ground mesh should be added to scene');
            assert.strictEqual(groundCall.arguments[0], world.ground);
            assert.ok(groundCall.arguments[0] instanceof THREE.Mesh);
        });
    });

    describe('Entity Management', () => {
        it('should add an entity', () => {
            const initialCount = world.colliders.length;

            const mockEntity = {
                type: 'test_entity',
                mesh: new THREE.Mesh(),
                update: () => {} // Custom update function
            };

            world.addEntity(mockEntity);

            assert.strictEqual(world.colliders.length, initialCount + 1);
            assert.strictEqual(world.colliders[world.colliders.length - 1], mockEntity);
            assert.ok(world.updatables.includes(mockEntity), 'Should be in updatables because it has custom update');
        });

        it('should add a landing pad to specific list', () => {
            const mockPad = {
                type: 'landingPad',
                mesh: new THREE.Mesh(),
                update: () => {}
            };

            world.addEntity(mockPad);
            assert.ok(world.landingPads.includes(mockPad));
        });

        it('should remove an entity by mesh', () => {
            const mockEntity = {
                type: 'test_entity',
                mesh: new THREE.Mesh(),
                update: () => {}
            };
            world.addEntity(mockEntity);

            const removed = world.removeEntity(mockEntity.mesh);

            assert.strictEqual(removed, mockEntity);
            assert.ok(!world.colliders.includes(mockEntity));
            assert.ok(!world.updatables.includes(mockEntity));
        });
    });

    describe('Map Loading', () => {
        it('should load map settings', () => {
            const mapData = {
                wind: { x: 10, y: 0, z: 5 },
                batteryDrain: 0.5,
                environment: {
                    startTime: 8.0,
                    daySpeed: 0.1,
                    timeLocked: true
                },
                objects: []
            };

            world.loadMap(mapData);

            assert.deepStrictEqual(world.wind, mapData.wind);
            assert.strictEqual(world.batteryDrain, 0.5);
            assert.strictEqual(world.timeCycle.time, 8.0);
            assert.strictEqual(world.timeCycle.speed, 0.1);
            assert.strictEqual(world.timeCycle.isLocked, true);
        });

        it('should clear existing entities before loading', () => {
            // Add a dummy entity
            const mockEntity = {
                type: 'test',
                mesh: new THREE.Mesh(),
                update: () => {}
            };
            world.addEntity(mockEntity);
            const initialColliderCount = world.colliders.length;

            // Load empty map
            world.loadMap({ objects: [] });

            // Should satisfy: all previous entities removed
            // Note: loadMap calls clear(), which removes all.
            // Then it parses objects. If objects is empty, colliders should be empty.
            assert.strictEqual(world.colliders.length, 0);
        });
    });

    describe('Export Map', () => {
        it('should export current state', () => {
            world.wind = { x: 1, y: 2, z: 3 };
            world.batteryDrain = 99;
            world.timeCycle.time = 15;

            const data = world.exportMap();

            assert.deepStrictEqual(data.wind, { x: 1, y: 2, z: 3 });
            assert.strictEqual(data.batteryDrain, 99);
            assert.strictEqual(data.environment.startTime, 15);
            assert.ok(Array.isArray(data.objects));
        });
    });

    describe('Update Loop', () => {
        it('should update subsystems and updatables', () => {
            // Mock subsystems update methods
            world.birdSystem.update = mock.fn();
            world.lightSystem.update = mock.fn();

            // Add an updatable entity
            const mockEntity = {
                type: 'updatable',
                mesh: new THREE.Mesh(),
                update: mock.fn()
            };
            world.addEntity(mockEntity);

            const dt = 0.1;
            const camera = {}; // dummy camera

            world.update(dt, camera);

            assert.strictEqual(world.birdSystem.update.mock.calls.length, 1);
            assert.strictEqual(world.lightSystem.update.mock.calls.length, 1);
            assert.strictEqual(mockEntity.update.mock.calls.length, 1);
            assert.strictEqual(mockEntity.update.mock.calls[0].arguments[0], dt);
        });
    });
});
