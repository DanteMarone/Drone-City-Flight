## 2024-05-23 - Physics Test Pitfalls
**Discovery:** Implicit environment checks (like Ground collision at y=0) can cause false positives in unit tests that place objects at the origin (0,0,0).
**Action:** When testing physics systems with environmental boundaries, always offset test fixtures away from the boundary (e.g., place objects at y=50) or explicitly filter the output to ignore environmental hits.

## 2024-05-23 - TimeCycle Math Precision
**Discovery:** Floating point comparisons for time wrapping (24 -> 0) require epsilon checks.
**Action:** Use `Math.abs(diff) < 0.0001` assertions for all time-based logic.

## 2025-02-14 - Node.js Module Resolution
**Discovery:** Running tests that import 'three' (ESM) in Node directly requires `NODE_PATH` to be set to the local `node_modules` because Node's ESM loader doesn't search `node_modules` by default for bare specifiers in some configurations without `package.json` "type": "module" fully resolved or standard resolution strategy.
**Action:** Run tests with `export NODE_PATH=$(pwd)/node_modules && node ...` to ensure dependencies are found.

## 2025-02-14 - Physics Logic on New Objects
**Discovery:** Logic relying on `matrixWorld` (like `invert()`) for newly created objects fails because the matrix is Identity until the next render frame. This caused newly spawned rings to be instantly collected (false positive) if the drone was at (0,0,0).
**Action:** Explicitly call `object.updateMatrixWorld()` on new entities if their transform is accessed for logic in the same frame.
