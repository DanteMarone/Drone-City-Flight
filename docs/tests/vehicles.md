# Vehicles Test Strategy

## Scope
This documentation covers the testing strategy for the vehicle system, specifically `VehicleEntity` and its subclass `PickupTruckEntity`. The tests focus on movement logic, waypoint navigation, and state management (e.g., waiting at stops).

## Scenarios

### VehicleEntity (Base Class)
*   **Initialization**: Verifies that waypoints are correctly assigned and `userData` is populated.
*   **Movement**: Checks that the vehicle moves towards the target waypoint at the correct speed.
*   **Waypoint Logic**: Ensures the vehicle snaps to the waypoint upon arrival and increments the target index.
*   **Looping**: Verifies the default behavior of looping back to the first waypoint after reaching the last one.

### PickupTruckEntity (Subclass)
*   **Ping-Pong Navigation**: Verifies that the truck reverses direction when reaching the end of the path (instead of looping).
*   **Wait Timer**: Tests the logic for pausing at endpoints for a specified duration before reversing. This includes:
    *   Setting the timer upon arrival.
    *   Decreasing the timer over time.
    *   Resuming movement after the timer expires.

## Mocking Strategy
Since the tests run in a Node.js environment without a DOM or WebGL:
*   **THREE.Mesh/Group**: Mocked using `THREE.Group` since we only need the position and `userData` properties.
*   **Rendering**: No rendering is performed; tests assert on `position` and internal state (`targetIndex`, `waitTimer`).
*   **Time**: `dt` (delta time) is manually passed to the `update` method to simulate frame progression.

## Key Data
*   **Waypoints**: Simple arrays of objects `{x, y, z}` or `THREE.Vector3`.
*   **Speed/Time**: Tests use simplified speeds (e.g., 1.0) and time steps (e.g., 1.0s) to make math predictable.

## Running Tests
Run all tests via:
```bash
npm test
```
This executes `src/test_all.js`, which includes `src/world/entities/vehicles.test.js`.
