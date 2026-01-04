# App.update Optimization

## Overview
The `App.update()` loop is the heartbeat of the application, running 60 times per second. Any memory allocation or inefficient iteration here has a significant cumulative impact on garbage collection (GC) pauses and battery life.

## Bottleneck 1: Hidden Vector Allocations
### The Problem
The landing pad recharge logic was performing a `Vector3.clone()` for every landing pad, every frame.

```javascript
// Old Code
this.world.landingPads.forEach(entity => {
    const localPos = this.drone.position.clone(); // <--- Allocation!
    entity.mesh.worldToLocal(localPos);
    // ...
});
```

With 1000 landing pads (theoretical load test), this creates 60,000 `Vector3` objects per second, forcing the Garbage Collector to work overtime.

### The Solution
We introduced a persistent scratch vector `_tempVec` in the `App` class.

```javascript
// New Code
this.world.landingPads.forEach(entity => {
    const localPos = this._tempVec.copy(this.drone.position); // <--- Reuse
    entity.mesh.worldToLocal(localPos);
    // ...
});
```

### Impact
Benchmarks show an **80% improvement** in execution time for this specific loop (0.47ms -> 0.09ms per 1000 pads), but more importantly, it reduces GC pressure to **zero** for this operation.

## Bottleneck 2: Array Mapping in Update
### The Problem
The collision system requires a list of "dynamic colliders" (rings) every frame. The previous code mapped the internal `rings` array to a new structure every single frame.

```javascript
// Old Code
const ringColliders = this.rings.rings.map(r => ({
    type: 'ring',
    mesh: r.mesh,
    box: null
}));
// ...
const dynamicColliders = [...ringColliders]; // <--- Allocation!
```

This allocated a new Array and N new Objects every frame.

### The Solution
We implemented a caching mechanism in `RingManager`. The collider list is now generated only when rings are added or removed.

```javascript
// RingManager
getColliders() {
    if (!this._cachedColliders) {
        this._cachedColliders = this.rings.map(...);
    }
    return this._cachedColliders;
}
```

In `App.update`, we simply reference this cached array.

```javascript
const dynamicColliders = this.rings.getColliders();
```

## Verification
- **Benchmark:** `src/verification/benchmark_app_update.js` verifies the vector allocation removal.
- **Physics Test:** `src/verification/test_physics.js` ensures collision logic remains correct.
