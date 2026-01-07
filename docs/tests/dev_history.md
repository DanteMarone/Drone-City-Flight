# Testing Strategy: History System (Undo/Redo)

## Scope
This document covers the unit testing strategy for the `CommandManager` and associated command classes (`TransformCommand`, `PropertyChangeCommand`, etc.) located in `src/dev/history.js`. These components are responsible for the editor's undo/redo functionality.

## Scenarios
The tests verify the following scenarios:
- **Command Stack Management**:
  - Pushing a command clears the redo stack.
  - Undoing moves a command from undo stack to redo stack.
  - Redoing moves a command from redo stack to undo stack.
- **Property Changes**:
  - `PropertyChangeCommand` correctly reverts a value on undo.
  - `PropertyChangeCommand` correctly applies a value on redo.
  - Supports both nested `userData.params` and direct `userData` properties.
- **Transform Changes**:
  - `TransformCommand` snapshots position, rotation, and scale.
  - Undo restores the "before" state.
  - Redo restores the "after" state.
  - **Lazy Resolution**: Verifies that objects can be resolved by UUID if the direct object reference is lost (simulating a history restore after map load).

## Mocking Strategy
- **`devMode`**: A lightweight mock object is used to simulate the editor environment.
  - `app.world.colliders`: An array acting as the "database" of world objects for UUID lookup.
  - `ui.updateProperties`: A spy function to verify UI updates without requiring a DOM.
  - `applyTransformSnapshot`: A helper function to apply state to mock Three.js objects.
- **`THREE`**: The actual `three` library is used for `Vector3`, `Euler`, and `Mesh` objects to ensure compatibility with real data structures.

## Key Data
- **Test Objects**: `THREE.Mesh` instances with `userData.uuid` are used to simulate game entities.
- **Snapshots**: State objects containing `{ position, rotation, scale }` are manually constructed to verify state transitions.
