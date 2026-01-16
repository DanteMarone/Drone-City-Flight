# Testing Strategy: SpatialHash

## Scope
**Unit Test** for `src/utils/spatialHash.js`.
This suite verifies the core spatial partitioning logic used for collision detection and entity management. It ensures that objects are correctly mapped to spatial cells and that the hashing function handles all coordinate ranges without collision.

## Scenarios
1.  **Basic Insert & Query**:
    -   Verify that an object inserted into the hash can be retrieved by querying its location.
    -   Verify that `clear()` correctly empties the hash.
2.  **AABB Coverage**:
    -   Verify that large objects (spanning multiple cells) are registered in all relevant cells.
3.  **Coordinate Handling**:
    -   Verify that negative coordinates are handled correctly (no mapping errors or array index out of bounds).
4.  **Collision Prevention**:
    -   **Critical**: Verify that the hashing function does NOT collide for coordinates that would be aliased by naive bit-packing (e.g., `z=-1` vs `z=65535`).
    -   This ensures the fix (switching to string keys) remains effective.

## Mocking Strategy
-   **No external mocks required**.
-   The test uses simple plain objects (`{ id: 1 }`) as clients and standard AABB objects (`{ min: {x, z}, max: {x, z} }`) as inputs.

## Key Learnings
-   Previous implementation used bit-packed integers `(xi << 16) | (zi & 0xFFFF)` which caused collisions when `zi` was negative or exceeded 16 bits.
-   The fix uses template strings `${xi}:${zi}` to guarantee unique keys for all integer coordinates.
