
import { describe, it, beforeEach } from 'node:test';
import { strict as assert } from 'assert';
import { DevSelectionManager } from './devSelectionManager.js';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// Test Helpers (Mocks)
// -----------------------------------------------------------------------------

function createMockDevMode() {
    return {
        selectedObjects: [],
        gizmo: {
            attached: [], // Custom property for verification
            attach: function(objs) { this.attached = objs; },
            detach: function() { this.attached = []; }
        },
        ui: {
            callCount: 0, // Custom property for verification
            onSelectionChanged: function() { this.callCount++; }
        }
    };
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('DevSelectionManager', () => {
    let devMode;
    let manager;
    let obj1, obj2, obj3;

    beforeEach(() => {
        devMode = createMockDevMode();
        manager = new DevSelectionManager(devMode);

        obj1 = new THREE.Mesh(); obj1.name = 'obj1';
        obj2 = new THREE.Mesh(); obj2.name = 'obj2';
        obj3 = new THREE.Mesh(); obj3.name = 'obj3';
    });

    describe('selectObject (Single/Toggle)', () => {
        it('should select a single object', () => {
            manager.selectObject(obj1);

            assert.equal(devMode.selectedObjects.length, 1);
            assert.equal(devMode.selectedObjects[0], obj1);
            assert.equal(devMode.gizmo.attached.length, 1);
            assert.equal(devMode.gizmo.attached[0], obj1);
            assert.equal(devMode.ui.callCount, 1);
        });

        it('should deselect when null is passed', () => {
            // Setup
            manager.selectObject(obj1);
            assert.equal(devMode.selectedObjects.length, 1);

            // Act
            manager.selectObject(null);

            // Assert
            assert.equal(devMode.selectedObjects.length, 0);
            assert.equal(devMode.gizmo.attached.length, 0);
        });

        it('should replace selection if shift is not pressed', () => {
            manager.selectObject(obj1);
            manager.selectObject(obj2); // Default shiftKey=false

            assert.equal(devMode.selectedObjects.length, 1);
            assert.equal(devMode.selectedObjects[0], obj2);
        });
    });

    describe('selectObject (Shift/Multi)', () => {
        it('should add to selection when shift is pressed', () => {
            manager.selectObject(obj1);
            manager.selectObject(obj2, true); // shiftKey=true

            assert.equal(devMode.selectedObjects.length, 2);
            assert.ok(devMode.selectedObjects.includes(obj1));
            assert.ok(devMode.selectedObjects.includes(obj2));
            assert.equal(devMode.gizmo.attached.length, 2);
        });

        it('should remove from selection if already selected (toggle) when shift is pressed', () => {
            manager.selectObjects([obj1, obj2]);

            manager.selectObject(obj1, true); // Should toggle obj1 off

            assert.equal(devMode.selectedObjects.length, 1);
            assert.equal(devMode.selectedObjects[0], obj2);
        });
    });

    describe('selectObjects (Direct Set)', () => {
        it('should set multiple objects directly', () => {
            const list = [obj1, obj2, obj3];
            manager.selectObjects(list);

            assert.equal(devMode.selectedObjects.length, 3);
            assert.deepEqual(devMode.selectedObjects, list);
            assert.equal(devMode.gizmo.attached.length, 3);
        });

        it('should handle empty array', () => {
            manager.selectObjects([obj1]);
            manager.selectObjects([]);

            assert.equal(devMode.selectedObjects.length, 0);
            assert.equal(devMode.gizmo.attached.length, 0);
        });

        it('should handle null/undefined by clearing selection', () => {
            manager.selectObject(obj1);
            manager.selectObjects(null);

            assert.equal(devMode.selectedObjects.length, 0);
        });
    });

    describe('Robustness', () => {
        it('should not crash if UI is missing', () => {
            devMode.ui = null;
            assert.doesNotThrow(() => manager.selectObject(obj1));
        });

        it('should not crash if onSelectionChanged is missing', () => {
            devMode.ui = {};
            assert.doesNotThrow(() => manager.selectObject(obj1));
        });
    });
});
