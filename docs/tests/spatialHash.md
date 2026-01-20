# SpatialHash Test Strategy

## Scope
This document outlines the testing strategy for the `SpatialHash` utility class located in `src/utils/spatialHash.js`. This class is a critical component for collision detection performance, used by the `ColliderSystem`.

## Scenarios
The unit tests in `src/utils/spatialHash.test.js` cover the following scenarios:

### Key Generation & Bitwise Logic
The core of the `SpatialHash` is its key generation logic: `(xi << 16) | (zi & 0xFFFF)`.
- **Unique Keys**: Verifies that distinct `(x, z)` coordinates produce distinct keys.
- **Z-Coordinate Wrapping**: Verifies that the `zi & 0xFFFF` mask causes Z coordinates to wrap every 65,536 units (cells). `z=0` and `z=65536` map to the same key.
- **Negative Z-Coordinates**: Verifies that negative `zi` values map to high positive indices (e.g., -1 maps to 65535) due to the bitwise AND operation.
- **X-Coordinate Wrapping**: Verifies that `xi << 16` causes X coordinates to wrap/overflow when `xi` exceeds the 16-bit range in a way that shifts bits out or into the sign bit.

### Insertion & Query
- **Single Cell Insertion**: Verifies that an object occupying a single cell can be inserted and retrieved.
- **Multi-Cell Insertion**: Verifies that an object larger than `cellSize` (or spanning a boundary) is inserted into all relevant cells.
- **Empty Query**: Verifies that querying an empty cell returns an empty array.

### Lifecycle
- **Clear**: Verifies that `clear()` removes all objects from the hash map.

## Mocking Strategy
- **No external mocks**: The tests use pure JavaScript objects for the "client" data, avoiding dependencies on Three.js or the DOM. This ensures the tests are fast and run in any environment.

## Key Findings / Limitations
- **World Size Limit**: Due to the 16-bit packing for Z and effectively X, the unique world space is limited to 65,536 cells along the Z axis before wrapping occurs. With a typical cell size of 100, this corresponds to 6,553,600 units.
- **Negative Coordinates**: Negative coordinates are valid but alias to large positive coordinates. This is acceptable provided the active game world does not span the entire 6.5 million unit range simultaneously.
