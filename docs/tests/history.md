# CommandManager Tests

## Scope
This test suite covers the `CommandManager` class in `src/dev/history.js`, which is responsible for handling the Undo/Redo system in Developer Mode.

## Scenarios
1.  **Stack Management**:
    *   Verifies that pushing a command adds it to the `undoStack`.
    *   Verifies that pushing a command clears the `redoStack`.
    *   Verifies that `undo()` moves a command from `undoStack` to `redoStack`.
    *   Verifies that `redo()` moves a command from `redoStack` to `undoStack`.

2.  **PropertyChangeCommand**:
    *   Verifies that `undo()` restores the previous property value.
    *   Verifies that `redo()` applies the new property value.
    *   Verifies handling of `userData.params` vs direct `userData` properties.

3.  **Serialization**:
    *   Verifies that `CommandManager` can be serialized to JSON (`toJSON`).
    *   Verifies that `CommandManager` can be reconstructed from JSON (`fromJSON`).
    *   Ensures strict type checking during deserialization.

## Mocking Strategy
*   **DevMode**: A minimal mock object is created with `app`, `world`, and `ui` properties to avoid instantiating the full application logic.
*   **World/Colliders**: A simple array mock is used to simulate the entity list.
*   **Entities**: Simple objects with `mesh` and `userData` are created to simulate game entities, avoiding Three.js mesh overhead.

## Key Data
*   **UUIDs**: Hardcoded UUIDs (e.g., `'test-uuid'`) are used to link commands to mock objects.
*   **Property Values**: Simple primitives (numbers, booleans) are used to test property changes.
