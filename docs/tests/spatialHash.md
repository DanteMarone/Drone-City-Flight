# SpatialHash Testing Strategy

## Scope
**Unit Testing** of the `SpatialHash` utility class in `src/utils/spatialHash.js`.
This class is responsible for spatial partitioning to optimize collision detection and neighbor queries.

## Scenarios
1.  **Happy Path**:
    -   Insert an object into a cell.
    -   Query that cell and receive the object.
    -   Verify the cell size initialization.

2.  **Negative Coordinates**:
    -   Insert objects at negative X and Z coordinates.
    -   Verify they are stored and retrieved from the correct logical buckets.

3.  **Multi-Cell Objects**:
    -   Insert an object with an AABB that spans multiple cells (e.g., crossing 0,0).
    -   Verify the object is registered in all relevant cells.

4.  **Clearing**:
    -   Verify that `clear()` removes all references and resets the state.

5.  **Edge Cases & Limitations**:
    -   **Bitwise Hashing Collision**: The current implementation uses bitwise operators `(xi << 16) | (zi & 0xFFFF)`. This creates a deterministic collision between `z = -1` and `z = 65535` (since `-1 & 0xFFFF` is `65535`).
    -   **Test Validation**: A specific test case demonstrates this collision to document it as "Code is Truth". This limitation is acceptable for world sizes smaller than 655km (assuming 1 unit = 1 meter and cell size = 10m).

## Mocking Strategy
-   **No external mocks required**: The class relies only on standard JavaScript `Map` and arithmetic.
-   **Data Fixtures**: Simple JS objects are used as "clients" and "AABBs" (e.g., `{ min: {x, z}, max: {x, z} }`).
