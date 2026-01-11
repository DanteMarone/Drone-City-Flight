
import { describe, it } from 'node:test';
import { strict as assert } from 'assert';
import { CommandManager, PropertyChangeCommand, BaseCommand } from './history.js';
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
        }
    };
}

function createMockObject(uuid) {
    const mesh = new THREE.Mesh();
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
