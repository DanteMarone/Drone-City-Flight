# Battery Logic Tests

## Scope
This test suite covers the `BatteryManager` class in `src/drone/battery.js`. It verifies the core gameplay mechanic of battery consumption, depletion, and recharging.

**Type:** Unit Test
**File:** `src/drone/battery.test.js`

## Scenarios

### 1. Happy Path
- **Initialization:** Verifies the battery starts at the configured MAX value.
- **Movement Drain:** Verifies that moving (Speed > 0.1) reduces the current charge by `DRAIN_RATE * dt`.
- **Hover Conservation:** Verifies that hovering (Speed < 0.1) does **not** consume battery.

### 2. Configuration & Overrides
- **World Override:** Verifies that if `window.app.world.batteryDrain` is set (e.g., by Dev Mode or Map settings), the battery uses this value instead of the default config. This is critical for custom map difficulty.

### 3. Edge Cases
- **Depletion:** Verifies that when charge drops to 0, `depleted` becomes `true` and the value clamps to 0.
- **Depleted State:** Verifies that a depleted battery stops updating/draining further.
- **Recharging:** Verifies `add()` increases charge and unsets the `depleted` flag.
- **Overflow:** Verifies that recharging cannot exceed `MAX`.
- **Reset:** Verifies `reset()` restores full charge and clears the depleted state.

## Mocking Strategy
- **`CONFIG`**: The real `src/config.js` is imported.
- **`THREE.Vector3`**: Mocked with a simple `MockVector3` class that implements `.length()` to avoid importing the full Three.js library in this unit test (though the test runner supports it).
- **`window.app`**: The global window object is mocked during specific tests to simulate the runtime environment where `world` settings might exist.
- **Setup/Teardown:** `setupMockApp` and `teardownMockApp` ensure test isolation.

## Key Data
- Default Drain Rate: 2.0 (from Config)
- Movement Speed Threshold: 0.1
