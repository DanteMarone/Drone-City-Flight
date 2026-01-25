## 2024-05-23 - Physics Test Pitfalls
**Discovery:** Implicit environment checks (like Ground collision at y=0) can cause false positives in unit tests that place objects at the origin (0,0,0).
**Action:** When testing physics systems with environmental boundaries, always offset test fixtures away from the boundary (e.g., place objects at y=50) or explicitly filter the output to ignore environmental hits.

## 2024-05-23 - TimeCycle Math Precision
**Discovery:** Floating point comparisons for time wrapping (24 -> 0) require epsilon checks.
**Action:** Use `Math.abs(diff) < 0.0001` assertions for all time-based logic.

## 2025-02-14 - Node.js Module Resolution
**Discovery:** Running tests that import 'three' (ESM) in Node directly requires `NODE_PATH` to be set to the local `node_modules` because Node's ESM loader doesn't search `node_modules` by default for bare specifiers in some configurations without `package.json` "type": "module" fully resolved or standard resolution strategy.
**Action:** Run tests with `export NODE_PATH=$(pwd)/node_modules && node ...` to ensure dependencies are found.

## 2025-02-14 - Matrix World Updates in Tests
**Discovery:** Three.js objects do not update their `matrixWorld` automatically when added to a scene in a headless (no-renderer) test environment. Physics logic relying on `matrixWorld` (like `applyMatrix4(mesh.matrixWorld)`) will use the Identity matrix, potentially causing false positives if test objects default to (0,0,0).
**Action:** Explicitly call `obj.updateMatrixWorld(true)` in test helpers or after modifying transforms in tests.

## 2026-01-25 - SpatialHash Bitwise Collision
**Discovery:** The optimized `SpatialHash` key generation `(xi << 16) | (zi & 0xFFFF)` causes a deterministic collision between `z = -1` and `z = 65535` because `-1` (0xFFFF) masks identically to `65535`.
**Action:** Accept this limitation for standard world sizes (< 655km), but document it explicitly in tests ("Code is Truth") and documentation to prevent future debugging of "ghost objects" from distant coordinates.
