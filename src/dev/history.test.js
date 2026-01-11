
import { describe, it } from 'node:test';
import { strict as assert } from 'assert';
import { CommandManager, PropertyChangeCommand, BaseCommand, TransformCommand } from './history.js';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// Test Helpers (Mocks)
// -----------------------------------------------------------------------------

function createMockDevMode() {
    return {
        app: {
            world: {
                colliders: []
            }
        },
        selectedObjects: [],
        ui: {
            updateProperties: () => {}
        },
        // Mock applyTransformSnapshot
        applyTransformSnapshot: (states) => {
             states.forEach(state => {
                 if (state.object) {
                     if (state.position) state.object.position.copy(state.position);
                     if (state.rotation) state.object.rotation.copy(state.rotation);
                     if (state.scale) state.object.scale.copy(state.scale);
                 }
             });
        }
    };
}

function createMockObject(uuid) {
    const mesh = new THREE.Mesh();
    mesh.position.set(0, 0, 0); // Initialize as THREE.Vector3
    mesh.rotation.set(0, 0, 0); // Initialize as THREE.Euler
    mesh.scale.set(1, 1, 1);    // Initialize as THREE.Vector3
    mesh.userData = {
        uuid: uuid,
        params: {}
    };
    return { mesh };
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('CommandManager', () => {

    describe('Stack Management', () => {
        it('should push commands and clear redo stack', () => {
            const manager = new CommandManager({});
            const cmd1 = new BaseCommand('cmd1');

            manager.push(cmd1);
            assert.equal(manager.undoStack.length, 1);
            assert.equal(manager.redoStack.length, 0);

            // Simulate undo
            manager.undoStack.pop();
            manager.redoStack.push(cmd1);
            assert.equal(manager.undoStack.length, 0);
            assert.equal(manager.redoStack.length, 1);

            // Push new command should clear redo
            const cmd2 = new BaseCommand('cmd2');
            manager.push(cmd2);
            assert.equal(manager.undoStack.length, 1);
            assert.equal(manager.redoStack.length, 0);
        });

        it('should execute undo/redo on commands', () => {
            const manager = new CommandManager({});
            let value = 0;

            const cmd = {
                description: 'Add',
                undo: () => { value -= 1; },
                redo: () => { value += 1; }
            };

            manager.push(cmd);

            // Initial state (push doesn't execute, it assumes already executed)
            // Wait, standard Command pattern: usually you execute THEN push.
            // The `CommandManager.push` just stores it.

            manager.undo();
            assert.equal(value, -1, 'Undo should decrement');
            assert.equal(manager.undoStack.length, 0);
            assert.equal(manager.redoStack.length, 1);

            manager.redo();
            assert.equal(value, 0, 'Redo should increment');
            assert.equal(manager.undoStack.length, 1);
            assert.equal(manager.redoStack.length, 0);
        });
    });

    describe('PropertyChangeCommand', () => {
        it('should modify object properties', () => {
            const devMode = createMockDevMode();
            const obj = createMockObject('test-uuid');
            devMode.app.world.colliders.push(obj);

            obj.mesh.userData.params.speed = 10;

            const cmd = new PropertyChangeCommand(
                devMode,
                'test-uuid',
                'speed',
                10,
                20
            );

            // Simulate the change that happened BEFORE the command was created
            // (In real app, we change value then push command)
            obj.mesh.userData.params.speed = 20;

            cmd.undo();
            assert.equal(obj.mesh.userData.params.speed, 10, 'Undo should restore old value');

            cmd.redo();
            assert.equal(obj.mesh.userData.params.speed, 20, 'Redo should apply new value');
        });

        it('should handle direct userData assignment if params is missing', () => {
            const devMode = createMockDevMode();
            const obj = createMockObject('test-uuid-2');
            delete obj.mesh.userData.params; // Remove params
            obj.mesh.userData.visible = true;
            devMode.app.world.colliders.push(obj);

            const cmd = new PropertyChangeCommand(
                devMode,
                'test-uuid-2',
                'visible',
                true,
                false
            );

            cmd.redo(); // Apply 'false'
            assert.equal(obj.mesh.userData.visible, false);

            cmd.undo(); // Restore 'true'
            assert.equal(obj.mesh.userData.visible, true);
        });
    });

    describe('TransformCommand', () => {
        it('should undo/redo transform changes', () => {
            const devMode = createMockDevMode();
            const obj = createMockObject('transform-uuid');
            devMode.app.world.colliders.push(obj);

            // Initial State (Before)
            const beforeState = [{
                object: obj.mesh,
                position: new THREE.Vector3(0, 0, 0),
                rotation: new THREE.Euler(0, 0, 0),
                scale: new THREE.Vector3(1, 1, 1)
            }];

            // Final State (After)
            const afterState = [{
                object: obj.mesh,
                position: new THREE.Vector3(10, 5, 0),
                rotation: new THREE.Euler(0, Math.PI, 0),
                scale: new THREE.Vector3(2, 2, 2)
            }];

            const cmd = new TransformCommand(devMode, beforeState, afterState);

            // Simulate object being in 'after' state
            obj.mesh.position.copy(afterState[0].position);

            // Undo -> Should go to (0,0,0)
            cmd.undo();
            assert.equal(obj.mesh.position.x, 0, 'Position X should be 0');
            assert.equal(obj.mesh.position.y, 0, 'Position Y should be 0');
            assert.equal(obj.mesh.scale.x, 1, 'Scale X should be 1');

            // Redo -> Should go to (10,5,0)
            cmd.redo();
            assert.equal(obj.mesh.position.x, 10, 'Position X should be 10');
            assert.equal(obj.mesh.position.y, 5, 'Position Y should be 5');
            assert.equal(obj.mesh.scale.x, 2, 'Scale X should be 2');
        });

        it('should lazily resolve objects by UUID if object reference is missing', () => {
            const devMode = createMockDevMode();
            const obj = createMockObject('lazy-uuid');
            devMode.app.world.colliders.push(obj);

            // Command with only UUID, no direct object reference
            const beforeState = [{
                objectUuid: 'lazy-uuid',
                object: null, // Simulate missing reference
                position: new THREE.Vector3(5, 5, 5),
                rotation: new THREE.Euler(0, 0, 0),
                scale: new THREE.Vector3(1, 1, 1)
            }];

            const afterState = [{
                objectUuid: 'lazy-uuid',
                object: null,
                position: new THREE.Vector3(10, 10, 10),
                rotation: new THREE.Euler(0, 0, 0),
                scale: new THREE.Vector3(1, 1, 1)
            }];

            const cmd = new TransformCommand(devMode, beforeState, afterState);

            // Undo should find 'lazy-uuid' in devMode.app.world.colliders
            cmd.undo();
            assert.equal(obj.mesh.position.x, 5, 'Should apply position 5');

            // Redo
            cmd.redo();
            assert.equal(obj.mesh.position.x, 10, 'Should apply position 10');
        });

        it('should gracefully handle missing objects', () => {
            const devMode = createMockDevMode();
            // No objects in world

            const beforeState = [{
                objectUuid: 'ghost-uuid',
                object: null,
                position: new THREE.Vector3(5, 5, 5),
                rotation: new THREE.Euler(),
                scale: new THREE.Vector3(1,1,1)
            }];

            const cmd = new TransformCommand(devMode, beforeState, []);

            // Should not crash
            try {
                cmd.undo();
            } catch (e) {
                assert.fail('Undo should not throw when object is missing');
            }
        });

        it('should serialize and deserialize correctly', () => {
            const devMode = createMockDevMode();

            // We need a dummy object to create the command, but serialization extracts data
            const obj = createMockObject('serial-uuid');

            const beforeState = [{
                object: obj.mesh,
                position: new THREE.Vector3(1, 2, 3),
                rotation: new THREE.Euler(0, 1, 0),
                scale: new THREE.Vector3(1, 1, 1)
            }];

            const cmd = new TransformCommand(devMode, beforeState, beforeState);

            const json = cmd.toJSON();

            assert.equal(json.type, 'Transform');
            assert.equal(json.beforeStates[0].objectUuid, 'serial-uuid');
            assert.equal(json.beforeStates[0].position.y, 2);

            // Deserialize
            const newCmd = TransformCommand.fromJSON(json, devMode);

            // Check deserialized state (should be pure data, no object ref yet)
            assert.equal(newCmd.beforeStates[0].objectUuid, 'serial-uuid');
            assert.equal(newCmd.beforeStates[0].object, undefined); // No object yet
            assert.ok(newCmd.beforeStates[0].position instanceof THREE.Vector3);
            assert.equal(newCmd.beforeStates[0].position.x, 1);
        });
    });

    describe('Serialization', () => {
        it('should serialize and deserialize PropertyChangeCommand', () => {
            const devMode = createMockDevMode();
            const manager = new CommandManager(devMode);

            const cmd = new PropertyChangeCommand(
                devMode,
                'uuid-123',
                'height',
                5,
                10,
                'Change Height'
            );
            manager.push(cmd);

            const json = manager.toJSON();
            assert.equal(json.length, 1);
            assert.equal(json[0].type, 'PropertyChange');
            assert.equal(json[0].objectUuid, 'uuid-123');

            // Reconstruct
            const newManager = CommandManager.fromJSON(json, devMode);
            assert.equal(newManager.undoStack.length, 1);

            const newCmd = newManager.undoStack[0];
            assert.ok(newCmd instanceof PropertyChangeCommand);
            assert.equal(newCmd.objectUuid, 'uuid-123');
            assert.equal(newCmd.beforeValue, 5);
        });
    });

});
