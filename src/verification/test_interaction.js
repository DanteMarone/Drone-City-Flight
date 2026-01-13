
import { test } from 'node:test';
import assert from 'node:assert';
import { InteractionManager } from '../dev/interaction.js';
import * as THREE from 'three';
import { JSDOM } from 'jsdom';

// --- Mocks ---
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.Event = dom.window.Event; // Add Event to global

class MockApp {
    constructor() {
        this.renderer = {
            domElement: {
                getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
                addEventListener: () => {}, // prevent error when accessing domElement
                removeEventListener: () => {}
            },
            scene: new THREE.Scene()
        };
        // Ensure domElement is actually an object that can receive event listeners in JSDOM if needed,
        // but for now, the mock object above is enough for the InteractionManager which attaches to window and uses domElement for bounds.
        // Wait, InteractionManager attaches to window for events.

        this.container = this.renderer.domElement;
        this.world = {
            ground: new THREE.Mesh(),
            addEntity: () => {},
            removeEntity: () => {}
        };
        this.renderer.scene.add(this.world.ground);
        this.colliderSystem = {
            addStatic: () => {},
            updateBody: () => {}
        };
        this.rings = {
             spawnRingAt: () => {},
             rings: []
        };
    }
}

class MockDevMode {
    constructor(app) {
        this.app = app;
        this.cameraController = { camera: new THREE.PerspectiveCamera() };
        this.selectedObjects = [];
        this.gizmo = {
            proxy: new THREE.Object3D(),
            control: { axis: null },
            captureOffsets: () => {},
            syncProxyToObjects: () => {}
        };
        this.grid = { enabled: false, snap: (v) => v };
        this.placementMode = null;
        this.history = { push: () => {} };
        this.enabled = true;
    }
    selectObject(obj, shift) {
        if (!obj) {
             this.selectedObjects = [];
        } else {
             this.selectedObjects = [obj];
        }
    }
    captureTransforms() { return []; }
    _transformsChanged() { return false; }
    setPlacementMode(mode) { this.placementMode = mode; }
    _recordCreation() {}
}

// Mock EntityRegistry for testing
import { EntityRegistry } from '../world/entities/index.js';
class MockEntity {
    constructor(params) {
        this.mesh = new THREE.Mesh();
        this.mesh.userData.type = 'mock';
        this.mesh.position.set(params.x || 0, 0, params.z || 0);
    }
    init() {}
    createCollider() { return new THREE.Box3(); }
}
// We must avoid re-registering if already registered to avoid warnings/errors?
// EntityRegistry usually overrides.
EntityRegistry.register('mock_entity', MockEntity);
EntityRegistry.register('road', MockEntity);
EntityRegistry.register('river', MockEntity);

// --- Tests ---

test('InteractionManager', async (t) => {
    const app = new MockApp();
    const devMode = new MockDevMode(app);
    const interaction = new InteractionManager(app, devMode);

    await t.test('Lifecycle: Enable/Disable', () => {
        interaction.enable();
        assert.strictEqual(interaction.active, true);
        interaction.disable();
        assert.strictEqual(interaction.active, false);
    });

    await t.test('Selection: Basic Raycast (Ground)', () => {
        interaction.enable();
        // Setup raycaster to hit ground
        interaction._getIntersect = () => new THREE.Vector3(10, 0, 10);

        // Mock a hit result on ground for _onMouseDown's internal logic
        // But _onMouseDown calls raycaster.intersectObjects manually.
        // We can't easily mock raycaster.intersectObjects without mocking the whole Raycaster prototype.
        // So we will rely on checking if it DOESN'T crash, or setup scene such that it misses.

        // Since scene only has ground, and ground is checked separately in logic...
        // Let's just ensure it runs.

        const event = {
            button: 0,
            target: app.renderer.domElement, // Mock check
            clientX: 100,
            clientY: 100,
            shiftKey: false
        };

        // If we want to simulate a hit, we'd need to add an object to scene and ensure raycaster hits it.
        // For now, testing that it doesn't crash on "miss" is valid.
        try {
            interaction._onMouseDown(event);
            assert.strictEqual(devMode.selectedObjects.length, 0); // Should be empty as we hit nothing (ground logic is separate return in _getIntersect, but _onMouseDown filters ground out for selection)
        } catch (e) {
            assert.fail(e);
        }
    });

    await t.test('Smart Placement: Start', () => {
        interaction.enable();
        devMode.setPlacementMode('road');
        interaction._getIntersect = () => new THREE.Vector3(5, 0, 5);

        const event = {
            button: 0,
            target: app.renderer.domElement,
            clientX: 100,
            clientY: 100
        };

        interaction._onMouseDown(event);

        assert.ok(interaction.activePlacement);
        assert.deepStrictEqual(interaction.activePlacement.anchor, new THREE.Vector3(5, 0, 5));
        assert.strictEqual(interaction.activePlacement.type, 'road');
        assert.ok(interaction.ghostMesh); // Ghost should be created
    });

    await t.test('Smart Placement: Stretch (Mouse Move)', () => {
        // Continue from previous state
        assert.ok(interaction.activePlacement);

        interaction._getIntersect = () => new THREE.Vector3(15, 0, 5); // Moved 10 units X

        const event = {
            button: 0,
            target: app.renderer.domElement,
            clientX: 200,
            clientY: 100
        };

        interaction._onMouseMove(event);

        // Ghost should be updated
        // Anchor (5,0,5) -> Current (15,0,5). Diff (10,0,0). Length 10.
        // Midpoint should be (10, 0, 5)

        assert.strictEqual(interaction.ghostMesh.scale.z, 10);
        assert.strictEqual(interaction.ghostMesh.position.x, 10);
    });

    await t.test('Smart Placement: Finish (Mouse Up)', () => {
         // Mock Registry create
         let createdType = null;
         const originalCreate = EntityRegistry.create;
         EntityRegistry.create = (type, params) => {
             createdType = type;
             return new MockEntity(params);
         };

         const event = { button: 0 };
         interaction._onMouseUp(event);

         assert.strictEqual(createdType, 'road');
         assert.strictEqual(interaction.activePlacement, null);
         assert.strictEqual(interaction.ghostMesh, null);
         assert.strictEqual(devMode.placementMode, null); // Should reset

         // Restore
         EntityRegistry.create = originalCreate;
    });

    await t.test('Ghost: Creation and Destruction', () => {
         interaction._createGhost('mock_entity');
         assert.ok(interaction.ghostMesh);
         assert.ok(interaction.ghostMesh.material.transparent);
         assert.strictEqual(interaction.ghostMesh.material.opacity, 0.5);

         interaction._destroyGhost();
         assert.strictEqual(interaction.ghostMesh, null);
    });
});
