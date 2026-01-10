# RingManager Testing Strategy

## Scope
Unit tests for `src/gameplay/rings.js`, covering spawning logic, collection detection, state management, and persistence interactions.

## Scenarios
1.  **Initialization**: Verifies that a ring is spawned immediately upon creation and added to the scene.
2.  **Spawning Logic**:
    *   **Periodic Spawn**: Checks that new rings are added after `spawnInterval`.
    *   **Max Limit**: Ensures ring count does not exceed 9.
    *   **Collision Avoidance**: Mocks `ColliderSystem` to verify that `spawnRing` retries if a collision is detected.
3.  **Collection Logic**:
    *   **Success**: Drone passes through the center (< 1.0 unit from center, < 0.5 unit from plane).
    *   **Failure (Rim Hit)**: Drone hits the torus rim (distance > 1.0), ensuring no collection occurs.
    *   **Failure (Distance)**: Drone is far away.
4.  **State Management**:
    *   **Clear**: `clear()` removes all rings from the scene and resets counters.
    *   **Load**: `loadRings()` correctly restores rings from data.

## Mocking Strategy
*   **Scene**: A simple object with `children` array and `add/remove` methods. Crucially, `add()` mocks `updateMatrixWorld()` to prevent physics false positives (see Sherlock Journal).
*   **Drone**: A minimal object with a `THREE.Vector3` position.
*   **ColliderSystem**: A mock exposing `checkCollisions` that returns controlled hit arrays to test retry logic.

## Key Data
*   **Drone Position**: Default is `(9999, 9999, 9999)` to prevent implicit collection of rings spawned at (0,0,0) before their matrix is updated.
*   **Ring Geometry**: Standard Torus (R=1.5, r=0.2).
