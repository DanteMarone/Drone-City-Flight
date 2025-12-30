# ColliderSystem Test Strategy

**Component:** `src/world/colliders.js`
**Test File:** `src/world/colliders.test.js`
**Type:** Unit / Integration (with Three.js)

## Scope
This test suite validates the core physics collision detection system, including:
1.  **Management:** Adding, removing, and updating static colliders (SpatialHash synchronization).
2.  **Broadphase:** Verifying SpatialHash queries return correct candidates.
3.  **Narrowphase:** Verifying accurate collision detection (Hits, Misses, Penetration depth).
4.  **Dynamic Objects:** Ensuring dynamic entities (passed per-frame) are checked.
5.  **Ground Plane:** Verifying the infinite ground plane collision logic.

## Execution
Since the project uses ES Modules, tests run via Node's built-in test runner.

```bash
# Requires local dependencies installed
pnpm install

# Run the test
node src/world/colliders.test.js
```

## Mocking Strategy
*   **Three.js:** Real `THREE.Vector3`, `THREE.Box3`, and `THREE.Mesh` instances are used. The physics engine relies heavily on Three.js math classes, so mocking them would test the mock rather than the logic.
*   **Config:** Imports the real `CONFIG` object.
*   **SpatialHash:** Uses the real `SpatialHash` implementation (integration test).

## Scenarios
| Scenario | Description |
| :--- | :--- |
| **Instantiation** | System initializes with empty lists and scratch vectors. |
| **Add Static** | Objects are added to `staticColliders` and the internal `spatialHash`. |
| **Remove Static** | Objects are removed, and the `spatialHash` is correctly rebuilt. |
| **Update Body** | Moving an object updates its position in the `spatialHash`. |
| **Collision (Hit)** | Drone inside a box triggers a hit response. |
| **Collision (Miss)** | Drone far from object triggers no response. |
| **Ground Collision** | Drone below `y=radius` triggers ground hit. |
| **Dynamic Collision** | Dynamic objects passed to `checkCollisions` are detected. |

## Notes
*   The tests assume a standard `CONFIG.WORLD.CHUNK_SIZE` (100).
*   `updateMatrixWorld(true)` is manually called on mock meshes to simulate the render loop behavior required for world-space calculations.
