# History System Testing Strategy

## Scope
This document outlines the testing strategy for the `DevMode` History System, specifically focusing on `TransformCommand` and `CommandManager`. These components are critical for the editor's Undo/Redo functionality and data persistence.

## Components Tested
*   **CommandManager**: Stack management (undo/redo), JSON serialization.
*   **TransformCommand**: State capture, lazy resolution of objects via UUID, application of transforms.
*   **PropertyChangeCommand**: Modification of object properties.

## Scenarios

### TransformCommand
1.  **Lazy Resolution**:
    *   **Goal**: Verify that commands stored with only UUIDs (e.g., after loading from JSON) correctly resolve to runtime objects when executed.
    *   **Test**: Create a command with a `beforeState` containing a UUID but `object: null`. Mock `devMode.app.world.colliders` to contain the matching object. Execute `undo()` and verify `applyTransformSnapshot` is called with the resolved object.
2.  **Missing Object**:
    *   **Goal**: Ensure that if an object referenced by a command no longer exists in the world, the command fails gracefully without crashing.
    *   **Test**: Create a command with a UUID that does not exist in `colliders`. Execute `undo()`/`redo()` and verify `applyTransformSnapshot` is NOT called.
3.  **Serialization (JSON)**:
    *   **Goal**: Verify that commands can be serialized to plain JSON and reconstructed.
    *   **Test**: `toJSON()` should produce an object with `type: 'Transform'`, `description`, and state arrays containing only data (Vector3/Euler serialized as objects). `fromJSON()` should reconstruct `THREE.Vector3` and `THREE.Euler` instances.

### CommandManager
1.  **Stack Operations**: Verify `push`, `undo`, `redo` maintain the correct stack order and clear the redo stack on new actions.
2.  **Batch Serialization**: Verify `toJSON()` serializes the entire stack and `fromJSON()` restores it.

## Mocking Strategy
*   **DevMode**: A partial mock object is created with:
    *   `app.world.colliders`: An array to simulate the Entity Registry.
    *   `applyTransformSnapshot(states)`: A spy function to verify transform application.
    *   `selectedObjects`: An array for selection state.
    *   `ui.updateProperties()`: A no-op function.
*   **World Objects**: Mock objects are created with `mesh.userData.uuid` and `mesh.userData.params` to simulate `BaseEntity` instances.
*   **THREE.js**: The tests run in a Node.js environment. `THREE` is imported directly. `Vector3` and `Euler` are used as real instances, not mocks.

## Key Data
*   **UUIDs**: Strings like `'uuid-1'`, `'uuid-2'`.
*   **Transforms**: Specific values (e.g., `pos: 10,20,30`) are used to verify application.
