# Performance Analysis: Entity Update Loop Allocations

## Overview

In the `src/world/entities` system, specific entities like `GuideDroneEntity` and `CourierDroneEntity` run per-frame logic in their `update(dt)` method. This method is called 60 times per second for every instance of these entities.

## The Bottleneck: Hidden Allocations

Before optimization, the `update()` methods used `Array.prototype.forEach` to iterate over internal arrays (like `_pulseMaterials` or `rotorGroups`).

```javascript
// Anti-pattern
this.rotorGroups.forEach((rotor, index) => {
    rotor.rotation.y += rotorSpin * (index % 2 === 0 ? 1 : -1);
});
```

While convenient, `forEach` creates a **new function closure** (the callback) every time it is called.
*   **Cost**: 1 allocation per item per frame.
*   **Scale**: 100 drones * 4 rotors * 60 fps = 24,000 allocations/sec.
*   **Impact**: Increased Garbage Collection (GC) pressure, leading to micro-stutters during gameplay.

## The Solution: Zero-Allocation Loops

We replaced `forEach` with standard `for` loops.

```javascript
// Optimized
const len = this.rotorGroups.length;
for (let i = 0; i < len; i++) {
    const rotor = this.rotorGroups[i];
    rotor.rotation.y += rotorSpin * (i % 2 === 0 ? 1 : -1);
}
```

### Affected Files
1.  `src/world/entities/guideDrone.js`
2.  `src/world/entities/courierDrone.js`

## Impact

*   **Complexity**: Remains `O(n)`, but constant factor overhead is reduced.
*   **Memory**: Zero allocations per frame for these loops.
*   **Readability**: Slightly more verbose, but acceptable for critical hot paths.

## Verification

The correctness was verified by running the full test suite (`npm run test`), ensuring that the logic (pulsing lights, spinning rotors) remains functionally identical.
