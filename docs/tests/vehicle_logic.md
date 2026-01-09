# Vehicle Entity Logic Tests

## Scope
Unit tests for `VehicleEntity` and its subclass `PickupTruckEntity`.
Focuses on path following, waypoint logic, ping-pong movement, and wait timers.
Visuals (Mesh generation) are mocked to avoid dependencies on `carGeometries.js` or `THREE` rendering contexts.

## Scenarios

### VehicleEntity (Looping)
1.  **Initialization**: Verifies waypoints are parsed and stored in `userData`.
2.  **Movement**: Checks that `update(dt)` moves the `modelGroup` towards the target index.
3.  **Looping**: Verifies that reaching the last waypoint resets the target index to 0 (Start), creating a continuous loop.

### PickupTruckEntity (Ping-Pong)
1.  **Waiting**: Verifies that the vehicle pauses for `waitTime` when reaching a terminal waypoint (Start or End).
    *   *Note:* The logic currently applies full `dt` to movement even in the frame where waiting finishes. The test accounts for this "overshoot".
2.  **Ping-Pong**: Verifies that reaching the end of the path reverses the `direction` property and decrements the target index, instead of looping to 0.

## Mocking Strategy
*   **TestVehicle / TestPickup**: Subclasses that override `createMesh` to return a simple Box geometry, bypassing the complex procedural car generation.
*   **Three.js**: Used for Vector math and basic Object3D hierarchy (`modelGroup` inside `mesh`).
*   **Environment**: No `World` or `Physics` needed. Tests run in isolation.

## Key Data
*   **Waypoints**: Simple linear arrays `[{x:10, y:0, z:0}, ...]`.
*   **Time**: `dt` is manually stepped to control simulation (e.g., `update(1.0)`).
