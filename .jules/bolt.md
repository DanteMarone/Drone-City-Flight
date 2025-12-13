## 2024-12-13 - [GC Pressure in Game Loops]
**Learning:** Frequent small allocations (like `new THREE.Vector3` or `new THREE.Object3D`) in core update loops add up significantly. Even "small" helper objects can cause measurable overhead and GC stutter in high-frequency loops (60fps).
**Action:** Cache reusable helper objects (dummy transforms, scratch vectors) as class properties or module constants instead of creating them inside `update()` or collision loops.
