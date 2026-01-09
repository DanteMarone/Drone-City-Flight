# Testing Strategy: Ring Manager

**Component:** `src/gameplay/rings.js`
**Test File:** `src/gameplay/rings.test.js`
**Framework:** Node.js native `node:test` + `assert`

## Overview
The `RingManager` controls the "Rings" gameplay loop: spawning rings, checking for collection by the drone, and managing the score. This suite tests the logic without rendering graphics by mocking `THREE` scene interactions and the Physics system.

## Scenarios

### 1. Initialization
*   **Case:** New manager instance.
*   **Expectation:**
    *   One ring is spawned immediately.
    *   Collected count is 0.

### 2. Spawning Logic
*   **Case:** `update(dt)` is called with `dt` > `spawnInterval`.
*   **Expectation:** A new ring is added to the list.
*   **Case:** `update(dt)` runs until max limit (9 rings).
*   **Expectation:** Spawning stops at 9 rings.
*   **Case:** Collider reports a hit at spawn location.
*   **Expectation:** Manager retries up to 10 times to find a clear spot.

### 3. Collection Logic
*   **Case:** Drone passes through center (dist < 1.0, z < 0.5).
*   **Expectation:** Ring is removed, score increments.
*   **Case:** Drone hits rim (dist > 1.3).
*   **Expectation:** Ring remains, score unchanged.
*   **Case:** Drone is far away.
*   **Expectation:** No interaction.

### 4. Persistence
*   **Case:** `loadRings(data)` is called.
*   **Expectation:** Existing rings cleared, new rings spawned at specific locations.

## Mocking Strategy

*   **Scene:** A simple object with `children` array and `add`/`remove` methods.
*   **Drone:** A plain object with a `position` Vector3.
*   **ColliderSystem:** Mocked `checkCollisions` method to return hits on demand (for testing retry logic).
*   **Three.js:** Uses real `THREE` math (Vector3, Matrix4) via Node.js import to ensure accurate transformation logic.

## Key Learnings (Sherlock)
*   **Matrix Updates:** The test uncovered a bug where newly spawned rings had Identity matrices, causing immediate false-positive collection. The fix involves calling `updateMatrixWorld()` immediately after spawn.
