# BirdSystem Testing Strategy

## Scope
This document outlines the testing strategy for the `BirdSystem` component (`src/world/birdSystem.js`). The tests focus on the AI state machine behavior, movement logic, and interaction with the player drone.

## Scenarios
The following scenarios are covered by the unit tests:

1.  **Initialization**:
    -   Verifies that birds are added to the system and start in the `PATROL` state.
2.  **State Transitions**:
    -   **PATROL -> CHASE**: Triggered when the drone enters the `CHASE_RADIUS`.
    -   **CHASE -> RETURN**: Triggered when the drone exits the `CHASE_RADIUS`.
    -   **RETURN -> PATROL**: Triggered when the bird returns to its original position (or `resumePos`).
3.  **Movement Logic**:
    -   Verifies that the bird moves towards its current target (Drone in CHASE, ResumePos in RETURN, Waypoints in PATROL).
    -   Verifies waypoint patrolling logic.
4.  **Interaction**:
    -   **Attack**: Verifies that the bird drains the drone's battery when in `CHASE` state and within `COLLISION_RADIUS`.

## Mocking Strategy
To ensure unit tests are fast and deterministic, external dependencies are mocked:

-   **THREE.js**:
    -   `Vector3`, `Quaternion`, `Matrix4`: Real Three.js math classes are used (or minimal mocks if `node:test` requires) to ensure accurate calculations.
    -   `Mesh`: Mocked as a simple object with `position`, `userData`, and stubbed `lookAt` method.
-   **Drone**:
    -   Mocked as an object with `mesh.position` and `battery.current` properties.
-   **CONFIG**:
    -   Default configuration values from `src/config.js` are used, but the logic is tested against relative distances to ensure robustness regardless of specific constant values.

## Key Data
-   **Test Fixtures**:
    -   `MockDrone`: Represents the player.
    -   `MockBirdMesh`: Represents the visual bird entity with necessary user data (`startPos`, `waypoints`).
-   **Environment**:
    -   Tests run in Node.js.
    -   `node_modules` must be properly resolved (using `NODE_PATH` if necessary) to import `three`.

## Future Improvements
-   Add tests for "flapping" animation logic (requires mocking `Math.sin` or checking internal state changes over time).
-   Add integration tests with the actual `PhysicsEngine` if collision logic becomes more complex than simple distance checks.
