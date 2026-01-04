# Entity Memory Optimization

## Overview
This document describes the memory optimization pattern used in Entity classes, specifically regarding the `update(dt)` loop.

## The Bottleneck
Creating new JavaScript objects (like `new THREE.Vector3()`) inside the `update(dt)` loop forces the Garbage Collector (GC) to run frequently. In a 60 FPS game loop, allocating even a few objects per frame across multiple entities generates thousands of short-lived objects per second. This causes "GC pauses" (stutters) when the collector cleans up.

## The Solution: Scratch Vectors
Instead of allocating new vectors, we reuse persistent module-level "scratch" vectors.

### Before (Anti-pattern)
```javascript
update(dt) {
    // ❌ Creates a new object 60 times/second
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
    this.position.add(forward);
}
```

### After (Optimized)
```javascript
// ✅ Allocated once at module load
const _tempVec = new THREE.Vector3();

update(dt) {
    // ✅ Reuses the existing object
    _tempVec.set(0, 0, 1).applyQuaternion(this.mesh.quaternion);
    this.position.add(_tempVec);
}
```

## Applied to:
-   `ConstructionWorkerEntity`: Refactored to replace `new THREE.Vector3` in particle emission logic with a new `_tempVec2` scratch vector.

## Verified (Already Optimized):
-   `BuskerEntity`: Confirmed usage of `_tempVec` for particle origin calculation.
-   `FuturisticVendingMachineEntity`: Confirmed no allocations in `update` loop (allocations restricted to `postInit`).
