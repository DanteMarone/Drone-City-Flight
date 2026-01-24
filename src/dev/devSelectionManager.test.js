
import { describe, it, beforeEach } from 'node:test';
import { strict as assert } from 'assert';
import { DevSelectionManager } from './devSelectionManager.js';

describe('DevSelectionManager', () => {
    let devMode;
    let manager;
    let gizmoAttachedTo = null;
    let gizmoDetached = false;
    let uiSelectionChangedCalled = false;

    beforeEach(() => {
        // Reset state
        gizmoAttachedTo = null;
        gizmoDetached = false;
        uiSelectionChangedCalled = false;

        // Mock DevMode dependencies
        devMode = {
            selectedObjects: [],
            gizmo: {
                attach: (objects) => {
                    gizmoAttachedTo = objects;
                },
                detach: () => {
                    gizmoDetached = true;
                }
            },
            ui: {
                onSelectionChanged: () => {
                    uiSelectionChangedCalled = true;
                }
            }
        };

        manager = new DevSelectionManager(devMode);
    });

    it('should select a single object', () => {
        const obj1 = { id: 1 };
        manager.selectObject(obj1);

        assert.deepEqual(devMode.selectedObjects, [obj1]);
        assert.strictEqual(gizmoAttachedTo, devMode.selectedObjects);
        assert.strictEqual(uiSelectionChangedCalled, true);
    });

    it('should clear selection when passed null', () => {
        const obj1 = { id: 1 };
        devMode.selectedObjects = [obj1]; // Setup initial state

        manager.selectObject(null);

        assert.deepEqual(devMode.selectedObjects, []);
        assert.strictEqual(gizmoDetached, true);
        assert.strictEqual(uiSelectionChangedCalled, true);
    });

    it('should add to selection with shift key', () => {
        const obj1 = { id: 1 };
        const obj2 = { id: 2 };
        devMode.selectedObjects = [obj1];

        manager.selectObject(obj2, true);

        assert.deepEqual(devMode.selectedObjects, [obj1, obj2]);
        assert.strictEqual(gizmoAttachedTo, devMode.selectedObjects);
    });

    it('should remove from selection with shift key if already selected', () => {
        const obj1 = { id: 1 };
        const obj2 = { id: 2 };
        devMode.selectedObjects = [obj1, obj2];

        manager.selectObject(obj1, true);

        assert.deepEqual(devMode.selectedObjects, [obj2]);
        assert.strictEqual(gizmoAttachedTo, devMode.selectedObjects);
    });

    it('should set single selection with shift key if object not found and list empty', () => {
        const obj1 = { id: 1 };
        devMode.selectedObjects = [];

        manager.selectObject(obj1, true);

        assert.deepEqual(devMode.selectedObjects, [obj1]);
    });

    it('should replace selection if shift key is false', () => {
        const obj1 = { id: 1 };
        const obj2 = { id: 2 };
        devMode.selectedObjects = [obj1];

        manager.selectObject(obj2, false);

        assert.deepEqual(devMode.selectedObjects, [obj2]);
    });

    it('should handle selectObjects directly', () => {
        const obj1 = { id: 1 };
        const obj2 = { id: 2 };

        manager.selectObjects([obj1, obj2]);

        assert.deepEqual(devMode.selectedObjects, [obj1, obj2]);
        assert.strictEqual(gizmoAttachedTo, devMode.selectedObjects);
        assert.strictEqual(uiSelectionChangedCalled, true);
    });

    it('should detach gizmo when selecting empty list', () => {
        manager.selectObjects([]);

        assert.deepEqual(devMode.selectedObjects, []);
        assert.strictEqual(gizmoDetached, true);
    });

    it('should handle missing ui gracefully', () => {
        delete devMode.ui; // Remove UI
        const obj1 = { id: 1 };

        // Should not throw
        manager.selectObject(obj1);

        assert.deepEqual(devMode.selectedObjects, [obj1]);
    });
});
