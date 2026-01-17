# Vehicles Optimization

## System Overview
The `VehicleEntity` (and its subclasses like `CarEntity`, `BusEntity`) logic handles moving vehicles along a path of waypoints. Each frame, the vehicle calculates the distance to its current target waypoint to determine if it should move towards it or snap to it (arrival).

## The Bottleneck
The previous implementation calculated the Euclidean distance (`Math.sqrt`) between the current position and the target position every frame for every vehicle.
Additionally, the direction vector normalization logic implicitly calculated the length (another `Math.sqrt`) or required the distance to be passed in.

```javascript
// Old Logic
const dist = current.distanceTo(target); // sqrt #1
if (dist > moveAmount) {
    dir.subVectors(target, current).normalize(); // sqrt #2 (inside normalize)
    // ...
}
```

This resulted in up to **two square root operations per vehicle per frame**. With 100+ vehicles, this adds up.

## The Solution
We switched to using **Squared Distance** for the arrival check, which avoids the square root entirely for the comparison.
If movement is required, we calculate the actual distance **once** and use it to normalize the direction vector manually (multiplication by reciprocal), avoiding the second square root in `normalize()`.

```javascript
// New Logic
_diff.subVectors(target, current);
const distSq = _diff.lengthSq(); // No sqrt

if (distSq > moveAmount * moveAmount) {
    const dist = Math.sqrt(distSq); // sqrt #1 (only if moving)
    _dir.copy(_diff).multiplyScalar(1 / dist); // Normalize without sqrt #2
    // ...
}
```

## Impact
- **Complexity:** Remains O(N) where N is vehicle count.
- **Operations:** Reduced square root calls by ~50% (from 2 to 1) in the moving case, and 100% (from 1 to 0) in the arrival check case if we were just checking.
- **Micro-Benchmark:** `Math.sqrt` is relatively expensive compared to multiplication. Eliminating it in hot loops is standard optimization.

## Verification
- Run `pnpm test` to ensure physics and entity logic remain correct.
- Visually verify vehicles still follow paths smoothly.
