# InputManager Test Strategy

## Scope
**Component:** `src/core/input.js` (InputManager)
**Type:** Unit Tests
**Test File:** `src/core/input.test.js`

## Test Strategy
The `InputManager` is tested in isolation by mocking the global `window` object to capture and trigger keyboard events (`keydown`, `keyup`). The tests verify that raw key events are correctly mapped to abstract "Actions" (e.g., `forward`, `jump`) based on the configuration.

## Scenarios
| Scenario | Description |
| :--- | :--- |
| **Initialization** | Verifies that event listeners are attached to the window on instantiation. |
| **Key Mapping** | checks if pressing a configured key (e.g., `ArrowUp`) activates the corresponding action (`forward`). |
| **Alternate Keys** | Verifies that secondary keys (e.g., `KeyI` for forward) also trigger the action. |
| **Movement Vector** | Calculates the resulting vector from combined inputs (e.g., Forward + Right) to ensure correct direction logic. |
| **Vertical & Yaw** | Verifies 3D movement inputs (Ascend, Descend, Yaw Left/Right). |
| **One-Shot Events** | Tests triggers like `RESET` which should be active for one frame and cleared by `resetFrame()`. |
| **Key Release** | Ensures actions are disabled when keys are released. |
| **Unmapped Keys** | Verifies that pressing keys not in the config does not affect state. |

## Mocks
*   **Window**: A partial mock of `window` is created to intercept `addEventListener` and manually trigger `keydown`/`keyup` handlers.
*   **Config**: The tests use the real `src/config.js` to ensure the mapping matches the actual game configuration.

## Key Data
*   **Events**: `{ code: 'KeyW' }` style objects are passed to the mock listeners.
*   **State**: Assertions check `input.actions` (booleans) and `input.events` (booleans).
