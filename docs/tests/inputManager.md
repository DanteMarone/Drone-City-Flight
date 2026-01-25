# InputManager Testing Strategy

**Component:** `src/core/input.js`
**Test File:** `src/core/input.test.js`

## Scope
Unit tests for the `InputManager` class, which handles keyboard input, action mapping, and movement vector calculation.

## Scenarios
1.  **Initialization**: Verifies that the manager initializes with default values (false) for all actions and events.
2.  **Key Mapping**:
    -   Pressing a bound key (e.g., 'KeyW') sets the corresponding action (`ascend`) to `true`.
    -   Releasing the key sets the action back to `false`.
    -   Alternate keys (e.g., 'ArrowUp' vs 'KeyI' for Forward) are handled correctly.
3.  **Movement Vector**:
    -   `getMovementInput()` calculates the correct `{x, y, z, yaw}` vector based on active actions.
    -   Opposing inputs (e.g., Left + Right) cancel each other out (result 0).
    -   Orthogonal inputs (e.g., Forward + Right) are combined.
4.  **One-Shot Events**:
    -   Events like `reset`, `pause`, `toggleCamera` are set to `true` on keydown.
    -   `resetFrame()` clears these events, ensuring they only trigger once per frame.
    -   Events are not re-triggered or toggled on keyup.

## Mocking Strategy
The `InputManager` relies heavily on global DOM objects (`window`, `document`).
-   **JSDOM**: Used to create a simulated browser environment.
-   **Global Pollution Management**:
    -   `global.window`, `global.document`, and `global.KeyboardEvent` are assigned in the `before` hook.
    -   These globals are deleted in the `after` hook to prevent side effects on other tests.
-   **Event Dispatch**: `window.dispatchEvent` is used to simulate user keyboard interactions.

## Key Data
-   Uses the default `CONFIG.INPUT.KEYBOARD` bindings defined in `src/config.js`.
-   Test fixtures include standard `KeyboardEvent` objects with `code` properties matching the config.
