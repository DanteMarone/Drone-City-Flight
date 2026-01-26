# Drone Physics Test Strategy

## Scope
This document describes the testing strategy for the `PhysicsEngine` class located in `src/drone/physics.js`. The tests are unit tests that isolate the physics logic from the rest of the application.

## Test Suite
- **File:** `src/drone/physics.test.js`
- **Runner:** `node:test` (via `src/test_all.js`)
- **Dependencies:** `three`

## Mocking Strategy
The `PhysicsEngine` depends on a `ColliderSystem` to detect collisions. We mock this dependency to provide deterministic collision data.

- **MockColliderSystem:** A simple class that implements `checkCollisions(position, radius, dynamicColliders)` and returns a pre-configured list of `Hit` objects.
- **THREE:** We use the real `three` library for `Vector3` math, as it is a core data structure and logic dependency.
- **CONFIG:** We use the real `src/config.js` configuration, assuming standard drone parameters.

## Scenarios Tested

### 1. No Collision
- **Input:** Drone moving freely, `checkCollisions` returns empty list.
- **Expected:** Position and Velocity remain unchanged.
- **Purpose:** Verify baseline stability.

### 2. Positional Correction (Penetration)
- **Input:** Drone penetrates a wall (Mock hit with `penetration > 0`).
- **Expected:** Drone position is adjusted along the contact normal by the penetration amount.
- **Purpose:** Ensure the drone is pushed out of obstacles.

### 3. Velocity Response (Bounce)
- **Input:** Drone hits a wall head-on (Mock hit with normal opposing velocity).
- **Expected:** Velocity is reflected (bounced) based on the restitution coefficient.
- **Purpose:** Verify the "bounciness" of collisions.

### 4. Friction Application (Tangential Velocity)
- **Input:** Drone hits a wall at an angle (Diagonal velocity).
- **Expected:** The velocity component tangential to the wall is reduced by the friction factor (0.9).
- **Purpose:** Verify that glancing blows slow down the drone (simulating friction/drag against the surface).
- **Note:** This test uncovered a bug where friction was calculated but not applied. The fix ensures friction is correctly applied.
