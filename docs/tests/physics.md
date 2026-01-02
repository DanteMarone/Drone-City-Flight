# Physics System Tests

**Scope:** Unit Tests (Node.js)
**Component:** `SpatialHash`, `ColliderSystem`
**Location:** `src/verification/test_physics.js`

## Overview
This test suite verifies the core physics collision detection logic, focusing on the custom `SpatialHash` implementation and the `ColliderSystem` wrapper. These systems are critical for gameplay (drone collisions) and performance (spatial partitioning).

## Scenarios

### SpatialHash
1. **Behavioral Key Verification:** Verifies that objects placed in different world coordinates (e.g., `(10,10)` vs `(110,10)`) land in distinct buckets and do not pollute each other's queries.
2. **Negative Coordinate Handling:** Ensures that objects with negative coordinates (e.g., `(-50, -50)`) are stored and retrieved correctly without colliding with positive coordinates (aliasing).
3. **Insertion & Query:**
   - Happy Path: Object inserted in a specific location is retrievable by querying that location.
   - Miss: Object inserted in one location is NOT returned when querying a distant location.
4. **Multi-Cell Spanning:** Large objects spanning multiple grid cells (e.g., roads) are registered in all relevant cells and returned by queries to any of those cells.

### ColliderSystem
1. **Static Collider Management:**
   - `addStatic()` correctly registers meshes and bounding boxes.
   - `remove()` cleanly updates the list and rebuilds the SpatialHash.
   - `updateBody()` correctly moves an object in the spatial index when its transform changes.
2. **Collision Detection:**
   - **Static Hits:** Verifies collision detection against a standard Box geometry.
   - **Ground Plane:** Verifies the implicit infinite ground plane check at `y=0`.
   - **Penetration Depth:** Checks that penetration vectors are calculated correctly (e.g., a sphere of radius 1 at y=0.5 has 0.5 penetration).

## Mocking Strategy
- **Three.js:** Imported directly via Node.js environment.
- **CONFIG:** Implicitly uses default `src/config.js` values via imports.
- **Render Loop:** Tests run synchronously in a single pass; no game loop or `requestAnimationFrame` is mocked.
- **Meshes:** Lightweight `THREE.Mesh` instances with `BoxGeometry` are created in-memory. `updateMatrixWorld()` is called manually to simulate the renderer's transform update step.

## Running Tests
Run via the command line from the project root:
```bash
pnpm test
```
