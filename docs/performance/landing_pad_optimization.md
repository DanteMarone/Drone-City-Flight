# Landing Pad Logic Optimization

## System Overview
The Drone City Flight application monitors the drone's position relative to "Landing Pads" to recharge its battery. This logic runs every frame in the main game loop (`App.update`).

## The Bottleneck (1): Iteration
Previously, the application iterated through `this.world.colliders` to find landing pads.
```javascript
this.world.colliders.forEach(entity => {
    if (entity.type === 'landingPad' && entity.mesh) {
        // ... matrix math ...
    }
});
```
`world.colliders` contains *every* static object in the world (buildings, roads, trees, props). In a typical scene with 500-2000 objects, this resulted in thousands of unnecessary iterations and string comparisons per frame, even though there are rarely more than 2-5 landing pads in a map.

## The Solution (1): Registry Pattern
We implemented a **Registry Pattern** specific to landing pads.
1. Modified `World` to maintain a dedicated `this.landingPads` array.
2. Updated `World.addEntity`, `World.removeEntity`, and `World.clear` to manage this list automatically alongside `colliders`.
3. Updated `App.update` to iterate `this.world.landingPads` instead.

```javascript
// New Loop
this.world.landingPads.forEach(entity => {
    if (entity.mesh) {
        // ... matrix math ...
    }
});
```

## Impact (1)
**Complexity:** O(N) -> O(M) per frame, where N is total world objects and M is number of landing pads.
**Benchmarks:**
- In a synthetic test with 2000 world objects and 5 landing pads:
    - **Before:** ~165ms for 10k iterations.
    - **After:** ~5.5ms for 10k iterations.
    - **Speedup:** ~30x faster for this specific logic block.

While the absolute time saved per frame is small (fractions of a millisecond), it removes a linear scaling factor from the main loop, ensuring the game remains performant as the world size grows.

---

## The Bottleneck (2): Allocation
**Issue:** Per-Frame Object Allocation
In the original `LandingPadEntity` implementation, the `update` method created a new `THREE.Color` instance every single frame to calculate the current hue for its light animation.

```javascript
// OLD CODE
update(dt) {
    // ...
    const color = new THREE.Color().setHSL(hue, 1, 0.5); // <--- Allocation!
    // ...
}
```

This pattern creates unnecessary garbage collection (GC) pressure.

## The Solution (2): Module-Level Scratch Object
We introduced a shared, module-level `_tempColor` object. This object is instantiated once when the module loads and is reused by all instances of `LandingPadEntity`.

```javascript
// NEW CODE
const _tempColor = new THREE.Color(); // Allocated once

update(dt) {
    // ...
    _tempColor.setHSL(hue, 1, 0.5); // Reused
    // ...
}
```

## Impact (2)
*   **Memory:** Eliminates 1 `THREE.Color` allocation per frame per Landing Pad.
*   **CPU:** Removes the overhead of object creation and subsequent garbage collection.
