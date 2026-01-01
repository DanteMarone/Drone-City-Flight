# Collider System Tests

**Scope:** Unit Tests
**Component:** `src/world/colliders.js`

This suite validates the core custom physics engine using the standard Node.js test runner (`node:test`). It ensures the SpatialHash optimization, collision detection algorithms, and entity lifecycle management function correctly without browser dependencies.

## Scenarios
1.  **Initialization:** Verifies the system creates its internal dependencies (SpatialHash, scratch vectors).
2.  **SpatialHash Integration:**
    -   Ensures objects are correctly indexed by grid cells.
    -   Verifies support for negative coordinates (bitwise hash logic).
3.  **Lifecycle Management:**
    -   **Remove:** Verifies `remove(mesh)` correctly removes objects from both the list and the spatial hash.
    -   **Update:** Verifies `updateBody(mesh)` moves the object to the correct new spatial hash cell when its position changes.
4.  **Primitive Collision (Box):**
    -   **Hit:** Sphere intersects an AABB.
    -   **Miss:** Sphere is outside the AABB.
    -   **Penetration:** Verifies correct depth and normal calculation.
5.  **Complex Collision (Ring/Torus):**
    -   **Rim Hit:** Sphere hits the solid tube of the ring.
    -   **Center Pass:** Sphere passes safely through the hole.
6.  **Hierarchical Collision:**
    -   Ensures collision detection recurses into `THREE.Group` children to find actual meshes.
7.  **Environment:**
    -   Verifies the implicit ground plane collision at `y=0`.

## Mocking Strategy
The tests run in a pure **Node.js** environment.
-   **Test Runner:** Uses `node:test` (`describe`, `it`, `assert`).
-   **Three.js:** Imported directly. Real math classes (`Vector3`, `Box3`, `Matrix4`) are used.
-   **Scene Graph:** Detached `THREE.Mesh` and `THREE.Group` objects are created with manually updated World Matrices.
-   **Entities:** Mocked as simple objects `{ mesh, box, type }` conforming to the `ColliderSystem` interface.

## Key Data
-   **Test Offset:** Objects are placed at `y=50` to avoid implicit Ground Plane collisions, except for the explicit Ground test.
-   **Scratch Objects:** Implicitly tested via sequence execution.
