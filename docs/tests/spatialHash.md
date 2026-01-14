# SpatialHash Testing Strategy

## Scope
This document outlines the testing strategy for the `SpatialHash` utility class located in `src/utils/spatialHash.js`. This class provides a spatial partitioning system for efficient 2D spatial queries (X, Z) of 3D objects.

## Scenarios
The tests cover the following scenarios:

1.  **Basic Insertion and Query**: Verifies that objects inserted into specific cells can be retrieved by querying those coordinates.
2.  **Cell Isolation**: Verifies that objects in different cells do not appear in queries for other cells.
3.  **Negative Coordinates**: Ensures that negative coordinates are handled correctly and do not alias with positive coordinates.
4.  **Large Coordinates (Collision Prevention)**: **CRITICAL**. Verifies that objects at very large coordinates (e.g., `z` and `z + 65536 * cellSize`) do not collide due to integer overflow or bit-masking limitations. This protects against the previously identified bug where 16-bit masking caused collisions every 65,536 units.
5.  **Multi-Cell Objects**: Ensures objects spanning multiple cells are registered in all relevant cells.

## Mocking Strategy
The `SpatialHash` tests are pure unit tests and do not require external mocks.
-   **Test Data**: Simple JavaScript objects (e.g., `{ id: 'obj1' }`) are used as clients.
-   **Geometry**: `THREE.Box3` instances are created with specific coordinates to define the bounding boxes for insertion.

## Key Learnings
-   **Bit-Packing vs. Strings**: The original implementation used bit-packed integers `(xi << 16) | (zi & 0xFFFF)` for keys to avoid GC. However, this caused unavoidable collisions for `zi` coordinates separated by 65,536 units. The implementation was refactored to use template string keys `${xi}:${zi}`, which eliminates this collision risk at the cost of slight GC overhead, which is acceptable for correctness in large worlds.
