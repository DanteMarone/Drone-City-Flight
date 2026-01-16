# Testing Strategy: SpatialHash

**Component:** `src/utils/spatialHash.js`
**Test File:** `src/utils/spatialHash.test.js`
**Type:** Unit Test

## Overview
The `SpatialHash` class provides a performant 2D spatial partitioning system using a hash map and bit-packed integer keys. It is critical for collision detection and proximity queries in the game world.

## Test Scenarios

### Happy Path
1.  **Insertion & Query:** Verify that an object inserted into a specific location can be retrieved by querying that location.
2.  **Empty Query:** Verify that querying an empty cell returns an empty array (not null/undefined).
3.  **Spanning Objects:** Verify that an object whose AABB (Axis-Aligned Bounding Box) spans multiple cells is correctly registered in all covered cells.

### Edge Cases
1.  **Negative Coordinates:**
    *   Test coordinates in the negative quadrant (e.g., `x: -5, z: -5`) to ensure `Math.floor` and bitwise operations handle negative integers correctly without aliasing to positive cells.
2.  **Symmetric Coordinates:**
    *   Verify that `(0, -1)` and `(-1, 0)` produce distinct keys. This specifically targets the bit-packing logic `(xi << 16) | (zi & 0xFFFF)` to ensure no collision occurs between these permutations.
3.  **Large Coordinates:**
    *   Test coordinates near the limit of the 16-bit cell index range (approx +/- 320,000 units for cell size 10). This ensures the bitwise logic holds up for the expected world size.
4.  **Clearing:**
    *   Verify `clear()` removes all entries.

## Mocking Strategy
*   **No external mocks required.** The test uses simple JS objects for clients and AABBs.
*   **Environment:** Runs in Node.js using `node:test` and `node:assert`.

## Key Data
*   **Cell Size:** 10 units (standard grid size).
*   **Bit Packing:** `(xi << 16) | (zi & 0xFFFF)` limits cell indices to signed 16-bit integers (-32768 to 32767).
