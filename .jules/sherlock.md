## 2024-05-23 - Physics Test Pitfalls
**Discovery:** Implicit environment checks (like Ground collision at y=0) can cause false positives in unit tests that place objects at the origin (0,0,0).
**Action:** When testing physics systems with environmental boundaries, always offset test fixtures away from the boundary (e.g., place objects at y=50) or explicitly filter the output to ignore environmental hits.
