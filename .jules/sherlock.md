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

## 2025-02-14 - Vehicle Logic Discovery: High Speed + Short Path = Instant Return
**Discovery:** While testing `PickupTruckEntity`'s wait logic, I discovered that if the vehicle speed is high (100) and the path is short (2 units), a large `dt` (3.1s) causes the vehicle to travel to the end, wait (logic processed in same frame?), reverse, and travel *back* to the start within a single update call. This caused the `waitTimer` to appear stuck or reset unexpectedly because it hit the *other* endpoint in the same frame.
**Action:** Updated test strategy to ensure `dt` and `speed` are calibrated such that the vehicle cannot traverse the entire path in a single frame when testing intermediate states like "waiting" or "just started moving".
