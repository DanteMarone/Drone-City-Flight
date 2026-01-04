# TimeCycle Test Strategy

## Scope
This test suite covers the `TimeCycle` class logic in `src/world/timeCycle.js`. It focuses on:
- Time progression logic (speed, dt).
- Day/Night cycle wrapping (24h loop).
- Sun position calculation (Orbit logic).
- Color interpolation logic (Lighting values).

## Scenarios
1. **Initialization:** Verify default values (noon start, 0 speed).
2. **Time Progression:** Ensure time advances correctly based on `speed` and `dt`.
3. **Time Wrapping:** Ensure time wraps from 24 back to 0 without discontinuity errors.
4. **Sun Position:** Verify sun position at key times (6am, 12pm, 6pm, 12am) matches expected cardinal directions.
5. **Lighting Interpolation:** Verify that `_updateLightingValues` correctly interpolates colors between keyframes.

## Mocking Strategy
- **THREE:** Uses the real `three` library as it is a pure math dependency and critical for `Vector3`/`Color` operations.
- **Environment:** No external DOM or Window dependencies are required for this unit test.

## Key Data
- **Keyframes:** The test validates against the hardcoded keyframes in `TimeCycle`.
