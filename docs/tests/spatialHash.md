# Test Strategy: SpatialHash

**Target Component:** `src/utils/spatialHash.js`
**Test File:** `src/utils/spatialHash.test.js`

## Scope
Unit tests for the `SpatialHash` utility class. This class provides a spatial partitioning system using a hash map with bit-packed integer keys for performance. It is used for broad-phase collision detection and entity lookups.

## Scenarios
1.  **Happy Path:**
    - Insert an object with a given AABB (Axis-Aligned Bounding Box) into a specific cell.
    - Query that cell and verify the object is returned.
    - Query empty cells and verify empty results.
2.  **Negative Coordinates:**
    - Verify that objects at negative X and Z coordinates are correctly indexed and do not incorrectly overlap with positive coordinates near the origin.
3.  **Multi-Cell Insertion:**
    - Verify that an object spanning multiple grid cells (e.g., a large building or moving vehicle crossing a line) is registered in all relevant cells.
4.  **State Management:**
    - Verify `clear()` properly removes all references.
5.  **Edge Cases & Limitations (The "Dark Corner"):**
    - **Bit-Packing Collision:** The current implementation uses `(xi << 16) | (zi & 0xFFFF)` for key generation.
        - `zi` is masked to 16 bits.
        - This means Z-indices wrap every 65,536 cells (`zi = 0` and `zi = 65536` generate the same key).
        - With a `cellSize` of 10, this wrapping occurs at Z = 655,360 world units.
    - The test suite **explicitly verifies this collision** to document the behavior as "Code is Truth". If the implementation is ever upgraded to use BigInt or string keys, this test will fail, signalling a behavior change.

## Mocking Strategy
- **Client Objects:** Simple Plain Old JavaScript Objects (POJOs) `{ id: '...' }` are used as clients.
- **AABB:** Simple `{ min: {x, z}, max: {x, z} }` objects mimic the Three.js Box3 interface expected by `insert`.
- **No External Deps:** The tests are pure logic and run in Node.js without DOM or Three.js dependencies.
