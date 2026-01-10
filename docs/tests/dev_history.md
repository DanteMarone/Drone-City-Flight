# Testing Strategy: History System (Dev Mode)

## Scope
This document covers the unit testing strategy for the `CommandManager` and associated command classes (`TransformCommand`, `PropertyChangeCommand`) located in `src/dev/history.js`. These components are responsible for the undo/redo functionality within the Level Editor (Dev Mode).

## Scenarios
The tests verify the following critical behaviors:

### CommandManager
1.  **Stack Management:** Verifies that commands are correctly pushed to the `undoStack` and that the `redoStack` is managed correctly (cleared on new push).
2.  **Undo/Redo Cycle:** Ensures that `undo()` and `redo()` methods invoke the corresponding methods on the command objects and move them between stacks.

### PropertyChangeCommand
1.  **Property Updates:** Verifies that primitive values (numbers, booleans) in `userData` or `userData.params` are correctly swapped between `beforeValue` and `afterValue` during undo/redo operations.
2.  **State Reversion:** Ensures that undoing a change restores the object to its exact previous state.

### TransformCommand
1.  **Transform Restoration:** Verifies that Position, Rotation, and Scale are snapshot and restored accurately.
2.  **Lazy Resolution:** **Crucial.** Verifies that commands can find their target objects by `UUID` even if the original JavaScript object reference is lost (e.g., after a map load or object recreation). This prevents "ghost" undo operations that do nothing.

## Mocking Strategy
The tests run in a Node.js environment without a browser or full 3D engine.
*   **Three.js:** Imported directly to provide Vector3/Euler math classes.
*   **DevMode & App:** A lightweight mock object is created for each test, providing:
    *   `app.world.colliders`: An array to register mock entities.
    *   `ui.updateProperties`: A no-op function to capture UI update calls.
    *   `applyTransformSnapshot`: A mock implementation to apply state changes to objects.

## Key Data
*   **Mock Entities:** `THREE.Mesh` instances with `userData.uuid` are used to simulate game entities.
*   **UUIDs:** Hardcoded strings (e.g., `'obj-1'`, `'obj-trans-1'`) are used to verify ID-based lookups.
