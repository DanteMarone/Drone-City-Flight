# InputManager Testing Strategy

## Scope
Unit tests for `src/core/input.js`. The `InputManager` is responsible for handling raw keyboard events and mapping them to abstract game actions (e.g., `ascend`, `forward`).

## Strategy
Tests are run in a Node.js environment using `JSDOM` to mock the browser's `window` and `document` interfaces. This allows us to trigger `KeyboardEvent`s programmatically and verify the manager's internal state.

## Scenarios
1.  **Initialization**: Verifies that `keys` and `actions` start in a neutral state.
2.  **Key Mapping**:
    -   **KeyDown**: Checks if specific keys (e.g., 'KeyW') correctly set the corresponding action (`ascend`).
    -   **KeyUp**: Checks if releasing keys clears the action.
    -   **Alternative Bindings**: Verifies that secondary keys (e.g., 'KeyI' for forward) work identically to primary keys.
3.  **Input Vectors**: Verifies that multiple keys combine correctly into a movement vector (`getMovementInput`), e.g., pressing Forward + Right produces `(1, 0, -1)`.
4.  **One-Shot Events**: Verifies that trigger events (like `toggleCamera`) are set true and remain true until explicitly cleared by `resetFrame()`.

## Mocking
-   **JSDOM**: Used to provide `window`, `document`, and `KeyboardEvent`.
-   **Dependencies**: The test imports `src/config.js` implicitly via `input.js` but does not mock it, assuming standard default config values.

## Running Tests
Run via the main test runner:
```bash
npm test
```
Or individually:
```bash
export NODE_PATH=$(pwd)/node_modules && node src/core/input.test.js
```
