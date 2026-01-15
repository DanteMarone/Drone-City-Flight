import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';
import { InteractionManager } from './interaction.js';
import { EntityRegistry } from '../world/entities/index.js';

describe('InteractionManager', () => {
    let interaction;
    let mockApp;
    let mockDevMode;
    let mockEntity;
    let containerRect;

    beforeEach(() => {
        // Mock DOM Container
        containerRect = {
            left: 0,
            top: 0,
            width: 1000,
            height: 1000,
            getBoundingClientRect: () => containerRect
        };

        // Mock App
        mockApp = {
            container: containerRect,
            renderer: {
                domElement: {},
                scene: {
                    children: [],
                    add: mock.fn(),
                    remove: mock.fn()
                }
            },
            world: {
                ground: new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshBasicMaterial()),
                addEntity: mock.fn()
            },
            colliderSystem: {
                addStatic: mock.fn()
            }
        };

        // Ensure ground has expected properties for Raycaster
        mockApp.world.ground.name = 'ground';
        mockApp.world.ground.updateMatrixWorld = mock.fn(() => THREE.Object3D.prototype.updateMatrixWorld.call(mockApp.world.ground));

        // Mock DevMode
        mockDevMode = {
            cameraController: {
                camera: new THREE.PerspectiveCamera()
            },
            grid: {
                enabled: true,
                snap: mock.fn((v) => {
                    v.x = Math.round(v.x);
                    v.z = Math.round(v.z);
                    return v;
                })
            },
            placementMode: null,
            _recordCreation: mock.fn(),
            setPlacementMode: mock.fn()
        };

        // Mock EntityRegistry
        mockEntity = {
            mesh: new THREE.Mesh(),
            createCollider: mock.fn(),
            updateTexture: mock.fn(),
            box: {} // Mock collider box
        };
        // Mock EntityRegistry.create to return our mock entity
        // Note: In a real module system, we might need a proper spy/stub library
        // if EntityRegistry is a live object. Since we can't easily re-wire imports in ESM
        // without a loader, we rely on the fact that we can't mock the import *binding* directly
        // but we can mock the method if the test runner supports it, or we assume EntityRegistry
        // is accessible.
        // HOWEVER, since EntityRegistry is imported in interaction.js, we can't easily mock it
        // from the outside without dependency injection or module mocking tools.
        // For this environment, we will assume we can monkey-patch EntityRegistry if it's mutable,
        // or we rely on InteractionManager behavior that we can influence.

        // Since we can't easily mock ESM imports in this native runner without flags/loaders,
        // we might face an issue here.
        // Plan B: We can't mock EntityRegistry easily.
        // BUT, `InteractionManager` uses `EntityRegistry.create`.
        // Let's see if we can just assign a mock to `EntityRegistry.create` if it's writable.
        if (!EntityRegistry.originalCreate) {
             EntityRegistry.originalCreate = EntityRegistry.create;
        }
        EntityRegistry.create = mock.fn((type, params) => mockEntity);

        interaction = new InteractionManager(mockApp, mockDevMode);

        // Setup Raycaster mock to always hit ground at (10, 0, 10) for simplicity
        // or we rely on real Raycaster behavior with our mock ground.
        // Using real Raycaster requires real geometry.
        const groundGeo = new THREE.PlaneGeometry(1000, 1000);
        groundGeo.rotateX(-Math.PI / 2);
        mockApp.world.ground.geometry = groundGeo;
        mockApp.world.ground.updateMatrixWorld();
        mockApp.renderer.scene.children.push(mockApp.world.ground);
    });

    afterEach(() => {
        // Restore EntityRegistry
        if (EntityRegistry.originalCreate) {
            EntityRegistry.create = EntityRegistry.originalCreate;
        }
    });

    it('initializes correctly', () => {
        assert.ok(interaction);
        assert.strictEqual(interaction.active, false);
    });

    describe('Placement Mode', () => {
        it('starts placement and creates ghost on mouse down', () => {
            mockDevMode.placementMode = 'road';

            // Mock event at center of screen (should hit 0,0,0 usually, or dependent on camera)
            // Camera is at 0,0,0 looking down -Z by default.
            // Let's position camera to see the ground.
            mockDevMode.cameraController.camera.position.set(0, 100, 0);
            mockDevMode.cameraController.camera.lookAt(0, 0, 0);
            mockDevMode.cameraController.camera.updateMatrixWorld();

            // Click at center
            const event = {
                clientX: 500,
                clientY: 500,
                button: 0,
                target: mockApp.renderer.domElement
            };

            interaction.active = true;
            interaction._onMouseDown(event);

            assert.ok(interaction.activePlacement);
            assert.strictEqual(interaction.activePlacement.type, 'road');
            assert.ok(interaction.ghostMesh);
            assert.strictEqual(EntityRegistry.create.mock.callCount(), 1); // 1 for ghost
        });

        it('updates ghost during drag (Anchor & Stretch)', () => {
            mockDevMode.placementMode = 'road';
            mockDevMode.cameraController.camera.position.set(0, 100, 0);
            mockDevMode.cameraController.camera.lookAt(0, 0, 0);
            mockDevMode.cameraController.camera.updateMatrixWorld();

            // 1. Mouse Down at (0,0)
            const downEvent = {
                clientX: 500, // Center -> (0,0)
                clientY: 500,
                button: 0,
                target: mockApp.renderer.domElement
            };
            interaction.active = true;
            interaction._onMouseDown(downEvent);

            const startCalls = EntityRegistry.create.mock.callCount(); // Should be 1 (ghost)

            // 2. Mouse Move to (10, 0)
            // Screen coords: x=0 is 500. Width=1000.
            // We want world x=10.
            // With perspective camera at 100 high looking down, FOV default (50),
            // we need to calculate screen pos.
            // Instead of math, let's mock `_getIntersect` to return controlled points.
            // It's cleaner for unit testing logic.

            interaction._getIntersect = mock.fn(() => new THREE.Vector3(10, 0, 0));

            const moveEvent = {};
            interaction._handlePlacementMouseMove(moveEvent);

            // Assert Ghost Transforms
            // Road should look at (10,0,0) from (0,0,0).
            // Length = 10.
            // Position = Midpoint (5,0,0).

            const ghost = interaction.ghostMesh;
            assert.strictEqual(ghost.position.x, 5);
            assert.strictEqual(ghost.position.z, 0);
            assert.strictEqual(ghost.scale.z, 10); // Length

            // Rotation: Looking down +X.
            // atan2(x=10, z=0) = PI/2.
            assert.ok(Math.abs(ghost.rotation.y - Math.PI / 2) < 0.001);
        });

        it('finalizes placement on mouse up', () => {
            mockDevMode.placementMode = 'river';
            interaction.active = true;

            // Setup active placement manually
            interaction.activePlacement = {
                anchor: new THREE.Vector3(0, 0, 0),
                type: 'river'
            };

            // Mock ghost
            interaction.ghostMesh = new THREE.Mesh();
            interaction.ghostMesh.position.set(5, 0, 0);
            interaction.ghostMesh.rotation.set(0, Math.PI/2, 0);
            interaction.ghostMesh.scale.set(1, 1, 10);

            // Call Mouse Up
            interaction._handlePlacementMouseUp({});

            // Verify Entity Creation
            // Last call to create should be the final entity
            // args: type, params
            const calls = EntityRegistry.create.mock.calls;
            const lastCall = calls[calls.length - 1];

            assert.strictEqual(lastCall.arguments[0], 'river');
            assert.strictEqual(lastCall.arguments[1].length, 10);

            // Verify Entity Added to World
            assert.strictEqual(mockApp.world.addEntity.mock.callCount(), 1);

            // Verify Cleanup
            assert.strictEqual(interaction.activePlacement, null);
            assert.strictEqual(interaction.ghostMesh, null);
            assert.strictEqual(mockDevMode.setPlacementMode.mock.calls[0].arguments[0], null);
        });

        it('snaps to grid correctly', () => {
             // Mock grid snap logic is already in beforeEach
             // We just verify it calls snap

             interaction.active = true;
             interaction.devMode.placementMode = 'tree'; // Point placement

             interaction._getIntersect = mock.fn(() => new THREE.Vector3(1.1, 0, 2.9));

             interaction._handlePlacementMouseMove({});

             // Snap should have been called
             assert.strictEqual(mockDevMode.grid.snap.mock.callCount(), 1);

             // Ghost should be at snapped position (1, 0, 3)
             const ghost = interaction.ghostMesh;
             assert.strictEqual(ghost.position.x, 1);
             assert.strictEqual(ghost.position.z, 3);
        });

        it('cancels placement', () => {
            interaction.activePlacement = { type: 'road' };
            interaction.ghostMesh = new THREE.Mesh();
            mockApp.renderer.scene.add(interaction.ghostMesh); // Simulate it being in scene

            interaction.cancelPlacement();

            assert.strictEqual(interaction.activePlacement, null);
            assert.strictEqual(interaction.ghostMesh, null);
            assert.strictEqual(mockApp.renderer.scene.remove.mock.callCount(), 1);
        });
    });
});
