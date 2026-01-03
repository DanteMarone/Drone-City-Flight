# Battery System Tests

## Scope
This test suite validates the core logic of the `BatteryManager` class (`src/drone/battery.js`). It focuses on verifying the energy consumption model, including idle states, movement drain, and external overrides via `DevMode` or map settings.

## Scenarios
1. **Initialization**: Verifies the battery starts at `CONFIG.BATTERY.MAX` (100).
2. **Idle State**: Ensures no battery is drained when the drone velocity is below the movement threshold (0.1).
3. **Movement Drain**: Verifies that energy is consumed at `CONFIG.BATTERY.DRAIN_RATE` when moving.
4. **Configuration Override**: Tests the integration with `window.app.world.batteryDrain`, ensuring map-specific settings take precedence over default config.
5. **Depletion**: Confirms that the battery clamps to 0 and sets the `depleted` flag correctly.
6. **Recharge**: Verifies that adding energy respects the maximum capacity and resets the `depleted` flag.
7. **Reset**: Ensures `reset()` restores full capacity and clears flags.

## Mocking Strategy
* **Environment (`window`)**: The global `window` object is mocked to simulate the browser environment where `window.app.world` stores map settings.
* **Three.js**: Uses the real `THREE.Vector3` implementation for velocity calculations to ensure accurate length/magnitude logic.
* **Config**: Imports the actual `src/config.js` to validate against real application constants.

## Key Data
* **Drain Rate**: Default is 2.0 units/sec.
* **Threshold**: Movement speed > 0.1 triggers drain.
