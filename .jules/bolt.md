## 2024-12-14 - [Scan vs Registry]
**Learning:** Iterating over a large general-purpose list (like `world.colliders`) to find a specific subtype (like `landingPad`) every frame is a silent performance killer. It scales linearly with world size, not feature usage.
**Action:** Maintain specialized lists (registries) for objects that require specific per-frame logic (e.g., `landingPads`, `updatables`) and iterate those instead.

## 2024-12-14 - [Hidden Allocations]
**Learning:** Even simple logic like `new THREE.Vector3(0, 0, offset).applyQuaternion(...)` inside an `update()` loop creates significant GC pressure when scaled to many entities.
**Action:** Use module-level scratch vectors (`_tempVec.set(...)`) instead of `new` for intermediate calculations in update loops.

## 2024-12-14 - [Per-Frame Material Updates]
**Learning:** `new THREE.Color()` in an `update()` loop is just as bad as `new THREE.Vector3()`. Visual effects (pulsing lights, changing hues) often sneak these allocations in.
**Action:** Use module-level `_tempColor` scratch objects for any color animation logic.

## 2024-12-15 - [Projectile Asset Reuse]
**Learning:** Dynamic entities spawning projectiles (like `AngryPersonEntity`) often blindly create `new Geometry()` and `new Material()` for every shot. This causes significant GC pressure and WebGL resource churn.
**Action:** Define `const PROJECTILE_GEO` and `PROJECTILE_MAT` at module scope for any repetitive ephemeral objects.
