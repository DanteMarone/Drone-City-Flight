# Input Manager Testing Strategy

**Component**: `src/core/input.js`
**Test File**: `src/core/input.test.js`

## 🎯 Scope
The `InputManager` is the critical bridge between the user's keyboard and the game's actions. Testing ensures that key presses are correctly mapped to abstract actions (like "jump", "forward") and that the state is consistent.

## 🧪 Scenarios

### 1. Key State Tracking
- **Scenario**: User presses and releases a key.
- **Verification**: The internal `keys` object accurately reflects `true` (pressed) and `false` (released).

### 2. Action Mapping
- **Scenario**: User presses a key bound to an action (e.g., `KeyW` -> `ascend`).
- **Verification**: The `actions` object updates the corresponding flag.

### 3. Alternate Bindings
- **Scenario**: User presses an alternate key for an action (e.g., `ArrowUp` or `KeyI` for `forward`).
- **Verification**: The action is triggered regardless of which valid key is used.

### 4. Movement Vector Calculation
- **Scenario**: User presses multiple direction keys (e.g., Forward + Right).
- **Verification**: `getMovementInput()` returns a normalized vector (x, y, z) reflecting the combination. Conflicting keys (Left + Right) should cancel out.

### 5. One-Shot Events
- **Scenario**: User triggers a toggle (e.g., `TOGGLE_CAMERA`).
- **Verification**: The event flag is set to `true` and then cleared after `resetFrame()` is called.

## 🛠 Mocking Strategy
The test suite mocks `global.window` to intercept event listeners.

```javascript
global.window = {
    addEventListener: (event, fn) => { ... },
    removeEventListener: (event, fn) => { ... }
};
```

- **Events**: We simulate events by manually invoking the registered callbacks with mock event objects `{ code: 'KeyA' }`.
- **Config**: We use the actual `src/config.js` to ensure the tests reflect the real game bindings.
