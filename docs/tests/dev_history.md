# Testing Strategy: History System (Dev Mode)

## Scope
This test suite validates the logic of the `CommandManager` and its concrete command implementations (`TransformCommand`, `PropertyChangeCommand`, `CreateObjectCommand`, etc.) located in `src/dev/history.js`. These classes are responsible for the Undo/Redo functionality in the in-game editor.

## Test File
*   `src/verification/test_history.js`

## Scenarios
We test the following core behaviors:

### CommandManager
*   **Push/Undo/Redo Cycle:** Verifies that a generic command can be pushed to the stack, undone (reverting state), and redone (applying state).
*   **Stack Management:** Verifies that pushing a new command clears the Redo stack (standard undo history behavior).

### PropertyChangeCommand
*   **Property Reversion:** Checks that modifying a property (e.g., `params.speed`) can be undone to the original value and redone to the new value.
*   **UserData handling:** Ensures it supports both `userData.params` (nested) and direct `userData` property modifications.

### TransformCommand
*   **Snapshot Restoration:** Verifies that position, rotation, and scale are correctly restored when undoing/redoing a transformation.
*   **Lazy Resolution:** **Critical.** Tests that the command can find objects by UUID if the direct object reference is lost (simulating a state where the command was deserialized or the object was re-created).

## Mocking Strategy
*   **Three.js:** Used directly (no mock needed for math classes like `Vector3`).
*   **DevMode/App:** A `createMockDevMode()` helper is used to simulate the global `window.app` context.
    *   `app.world.colliders`: Mocked as an array of objects to support UUID lookup.
    *   `ui.updateProperties`: Mocked to prevent UI rendering errors.
    *   `applyTransformSnapshot`: Implemented in the mock to apply values to the mocked objects.

## Key Data
*   **Test Objects:** Simple `THREE.Mesh` instances with `userData.uuid` are used as stand-ins for game entities.
*   **UUIDs:** Hardcoded strings (e.g., `'obj-1'`, `'obj-trans-1'`) are used to link commands to mock objects.
