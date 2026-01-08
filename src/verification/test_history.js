// src/verification/test_history.js
import * as THREE from 'three';
import { strict as assert } from 'assert';
import { CommandManager, PropertyChangeCommand, TransformCommand } from '../dev/history.js';

// Test Helper (copied from test_physics.js for consistency)
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

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------
function createMockDevMode() {
    return {
        app: {
            world: {
                colliders: [] // Populated in tests
            }
        },
        ui: {
            updateProperties: (obj) => {
                // mock tracker
                this.lastUpdatedObject = obj;
            }
        },
        selectedObjects: [],
        applyTransformSnapshot: (resolvedStates) => {
            resolvedStates.forEach(state => {
                const obj = state.object;
                if (obj) {
                    obj.position.copy(state.position);
                    obj.rotation.copy(state.rotation);
                    obj.scale.copy(state.scale);
                }
            });
        }
    };
}

// -----------------------------------------------------------------------------
// Suite: CommandManager
// -----------------------------------------------------------------------------
describe('CommandManager', () => {

    it('should push, undo, and redo commands', () => {
        const devMode = createMockDevMode();
        const manager = new CommandManager(devMode);

        let value = 0;
        const testCommand = {
            description: 'Test Command',
            undo: () => { value -= 1; },
            redo: () => { value += 1; }
        };

        // Execute (Push implies execution usually, but in this manager push just stores it?
        // Looking at history.js, push just adds to stack. The action is usually performed *before* pushing in the app logic.
        // Wait, undo() undoes it. So the state is assumed "done" when pushed.

        manager.push(testCommand);
        assert.equal(manager.undoStack.length, 1);
        assert.equal(manager.redoStack.length, 0);

        // Undo
        manager.undo();
        assert.equal(value, -1, 'Undo should decrement value');
        assert.equal(manager.undoStack.length, 0);
        assert.equal(manager.redoStack.length, 1);

        // Redo
        manager.redo();
        assert.equal(value, 0, 'Redo should increment value back');
        assert.equal(manager.undoStack.length, 1);
        assert.equal(manager.redoStack.length, 0);
    });

    it('should clear redo stack on new push', () => {
        const manager = new CommandManager({});
        const cmd1 = { undo: () => {}, redo: () => {} };
        const cmd2 = { undo: () => {}, redo: () => {} };

        manager.push(cmd1);
        manager.undo(); // Moves to redo stack
        assert.equal(manager.redoStack.length, 1);

        manager.push(cmd2);
        assert.equal(manager.redoStack.length, 0, 'Redo stack should be cleared on new push');
        assert.equal(manager.undoStack.length, 1, 'Undo stack should have 1 item (cmd2)');
        assert.equal(manager.undoStack[0], cmd2);
    });
});

// -----------------------------------------------------------------------------
// Suite: PropertyChangeCommand
// -----------------------------------------------------------------------------
describe('PropertyChangeCommand', () => {
    it('should update object property on undo/redo', () => {
        const devMode = createMockDevMode();

        // Setup Object
        const mesh = new THREE.Mesh();
        mesh.userData = { uuid: 'obj-1', params: { speed: 10 } };
        devMode.app.world.colliders.push({ mesh }); // Register in world

        // Create Command: Change speed from 10 to 20
        const cmd = new PropertyChangeCommand(devMode, 'obj-1', 'speed', 10, 20);

        // Assume the change happened in UI, so we are at state 20.
        // Wait, the command stores before/after.
        // Undo should set to before (10). Redo set to after (20).

        // Test Undo
        cmd.undo();
        assert.equal(mesh.userData.params.speed, 10, 'Undo should revert speed to 10');

        // Test Redo
        cmd.redo();
        assert.equal(mesh.userData.params.speed, 20, 'Redo should apply speed 20');
    });

    it('should handle direct userData properties', () => {
        const devMode = createMockDevMode();
        const mesh = new THREE.Mesh();
        mesh.userData = { uuid: 'obj-2', isLocked: false }; // Direct userData, not in params
        devMode.app.world.colliders.push({ mesh });

        const cmd = new PropertyChangeCommand(devMode, 'obj-2', 'isLocked', false, true);

        // Test Undo
        cmd.undo();
        assert.equal(mesh.userData.isLocked, false, 'Undo should revert isLocked');

        // Test Redo
        cmd.redo();
        assert.equal(mesh.userData.isLocked, true, 'Redo should apply isLocked');
    });
});

// -----------------------------------------------------------------------------
// Suite: TransformCommand
// -----------------------------------------------------------------------------
describe('TransformCommand', () => {
    it('should restore transform state', () => {
        const devMode = createMockDevMode();

        const mesh = new THREE.Mesh();
        mesh.userData.uuid = 'obj-trans-1';
        mesh.position.set(0, 0, 0);
        devMode.app.world.colliders.push({ mesh });

        // Define States
        const stateBefore = {
            objectUuid: 'obj-trans-1',
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(0, 0, 0),
            scale: new THREE.Vector3(1, 1, 1)
        };

        const stateAfter = {
            objectUuid: 'obj-trans-1',
            position: new THREE.Vector3(10, 5, 0),
            rotation: new THREE.Euler(0, Math.PI, 0),
            scale: new THREE.Vector3(2, 2, 2)
        };

        const cmd = new TransformCommand(devMode, [stateBefore], [stateAfter]);

        // Test Redo (Apply After)
        cmd.redo();
        assert.equal(mesh.position.x, 10);
        assert.equal(mesh.scale.x, 2);
        // assert.equal(mesh.rotation.y, Math.PI); // Float precision might trick us
        assert.ok(Math.abs(mesh.rotation.y - Math.PI) < 0.001);

        // Test Undo (Apply Before)
        cmd.undo();
        assert.equal(mesh.position.x, 0);
        assert.equal(mesh.scale.x, 1);
        assert.equal(mesh.rotation.y, 0);
    });

    it('should resolve objects by UUID if object reference is missing', () => {
        // This simulates loading from history where objects are recreated but references in command are lost/null
        const devMode = createMockDevMode();
        const mesh = new THREE.Mesh();
        mesh.userData.uuid = 'obj-lazy';
        devMode.app.world.colliders.push({ mesh });

        const stateBefore = {
            objectUuid: 'obj-lazy',
            object: null, // Simulate missing ref
            position: new THREE.Vector3(1, 1, 1),
            rotation: new THREE.Euler(),
            scale: new THREE.Vector3(1, 1, 1)
        };
        const stateAfter = { ...stateBefore, position: new THREE.Vector3(2, 2, 2) };

        const cmd = new TransformCommand(devMode, [stateBefore], [stateAfter]);

        cmd.redo();
        assert.equal(mesh.position.x, 2, 'Should find object by UUID and apply transform');
    });
});
