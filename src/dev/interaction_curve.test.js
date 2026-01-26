import { test, describe, it, mock } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';
import { JSDOM } from 'jsdom';
import { InteractionManager } from './interaction.js';
import { EntityRegistry } from '../world/entities/index.js';

// Mock DOM
const dom = new JSDOM();
global.window = dom.window;
global.document = dom.window.document;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;

// Mock Canvas
HTMLCanvasElement.prototype.getContext = () => ({
    fillRect: () => {},
    fillStyle: '',
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    strokeStyle: '',
    lineWidth: 0,
    bezierCurveTo: () => {},
});

// Mock Dependencies
const mockApp = {
    container: {
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 })
    },
    renderer: {
        domElement: {},
        scene: {
            children: [],
            add: () => {},
            remove: () => {}
        }
    },
    world: {
        ground: {},
        addEntity: () => {}
    },
    colliderSystem: {
        addStatic: () => {}
    }
};

const mockDevMode = {
    cameraController: {
        camera: new THREE.PerspectiveCamera()
    },
    grid: {
        enabled: false, // Disable grid snapping for cleaner test coordinates
        snap: (p) => p.set(Math.round(p.x), p.y, Math.round(p.z))
    },
    placementMode: null,
    setPlacementMode: (mode) => { mockDevMode.placementMode = mode; },
    selectObject: () => {},
    captureTransforms: () => [],
    _recordCreation: () => {},
    _transformsChanged: () => false,
    history: { push: () => {} }
};

describe('InteractionManager - Curve Road', () => {
    it('should handle 3-step curve placement', () => {
        const interaction = new InteractionManager(mockApp, mockDevMode);

        // Mock Raycaster
        interaction.raycaster.intersectObjects = () => [{ point: new THREE.Vector3(0, 0, 0), object: mockApp.world.ground }];

        // 1. Enable and Set Mode
        interaction.enable();
        interaction.devMode.placementMode = 'curve_road';

        // 2. Click 1: Start Point
        const event1 = { button: 0, clientX: 0, clientY: 0, target: mockApp.renderer.domElement };
        // We need to mock _getIntersect to return specific points
        interaction._getIntersect = (e) => new THREE.Vector3(e.clientX, 0, e.clientY);

        // Click (0, 0)
        interaction._onMouseDown(event1);

        assert.ok(interaction.activePlacement, 'Should have active placement');
        assert.strictEqual(interaction.activePlacement.type, 'curve_road');
        assert.strictEqual(interaction.activePlacement.step, 1, 'Should be at step 1');
        assert.deepStrictEqual(interaction.activePlacement.anchor, new THREE.Vector3(0, 0, 0));

        // 3. Move: Ghost Update
        // Ensure it doesn't crash
        interaction._onMouseMove({ clientX: 10, clientY: 10 });

        // 4. Click 2: End Point
        interaction._onMouseDown({ button: 0, clientX: 10, clientY: 10, target: mockApp.renderer.domElement });

        assert.strictEqual(interaction.activePlacement.step, 2, 'Should be at step 2');
        assert.deepStrictEqual(interaction.activePlacement.endPoint, new THREE.Vector3(10, 0, 10));

        // 5. Click 3: Control Point & Finalize
        // Mock EntityRegistry.create to verify it was called
        const createSpy = mock.method(EntityRegistry, 'create', () => ({ mesh: new THREE.Mesh(), type: 'curve_road' }));

        interaction._onMouseDown({ button: 0, clientX: 5, clientY: 0, target: mockApp.renderer.domElement });

        assert.strictEqual(createSpy.mock.callCount(), 1, 'Should create entity');
        const callArgs = createSpy.mock.calls[0].arguments;
        assert.strictEqual(callArgs[0], 'curve_road');
        const params = callArgs[1];

        assert.strictEqual(params.x, 0);
        assert.strictEqual(params.z, 0);
        assert.strictEqual(params.endOffset.x, 10);
        assert.strictEqual(params.endOffset.z, 10);
        assert.strictEqual(params.controlOffset.x, 5);
        assert.strictEqual(params.controlOffset.z, 0);

        assert.strictEqual(interaction.activePlacement, null, 'Placement should be cleared');

        // Restore mock
        createSpy.mock.restore();
    });
});
