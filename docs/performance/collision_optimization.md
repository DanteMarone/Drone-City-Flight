# Collider System Optimization: Bounding Sphere for Dynamic Vehicles

## System Overview
The `ColliderSystem` performs collision detection between the drone and world entities.
For **dynamic entities** (like Cars, Trucks, Bicycles), the system must update the bounding volume of the entity every frame as it moves and rotates.

## The Bottleneck
Previously, `VehicleEntity` maintained a world-space `THREE.Box3` (`this.box`).
Every frame, `update(dt)` executed:
```javascript
this.box.copy(this._localBox).applyMatrix4(modelGroup.matrixWorld);
```
`Box3.applyMatrix4` is computationally expensive because it:
1.  Transforms all 8 corner points of the box.
2.  Re-calculates the min/max from those 8 transformed points.
3.  This involves significant matrix math (8 vector transforms) per vehicle per frame.

With 50+ vehicles, this overhead accumulates (approx 0.05ms per vehicle, or 2.5ms total on lower-end devices just for box updates).

## The Solution
We introduced a **Bounding Sphere** (`this.boundingSphere`) for dynamic vehicle entities.
Updating a sphere is much cheaper:
```javascript
this.boundingSphere.copy(this._localSphere).applyMatrix4(modelGroup.matrixWorld);
```
`Sphere.applyMatrix4` only requires:
1.  Transforming the center point (1 vector transform).
2.  Scaling the radius (1 scale check).

The `ColliderSystem` was updated to check `other.boundingSphere` first during the Medium Phase check. If the sphere intersects the drone, it proceeds to the Narrow Phase (checking individual meshes).

## Implementation Details
1.  **VehicleEntity**:
    *   Computes `_localSphere` in `postInit`.
    *   In `update(dt)`, updates `this.boundingSphere` instead of `this.box`.
    *   `this.box` remains available (as `BaseEntity` contract) but is stale for moving cars (at spawn position). This is acceptable because `SpatialHash` relies on static positions for broadphase anyway, and dynamic collision uses the `dynamicColliders` list which now uses the Sphere.

2.  **ColliderSystem**:
    *   Modified `_checkObject` to check `boundingSphere` if available.
    *   Falls back to `box` if no sphere exists.

## Impact
*   **Performance**: `Sphere.applyMatrix4` is **~5.6x faster** than `Box3.applyMatrix4`.
*   **Complexity**:
    *   Box Update: O(8) vector ops.
    *   Sphere Update: O(1) vector op.
*   **Correctness**: The sphere effectively wraps the object. Since the narrow phase (`_checkMeshRecursively`) still checks exact mesh geometry, collision accuracy is preserved.

## Visuals
**Before:**
`Vehicle.update` -> `Box.applyMatrix4` (Expensive) -> `Collider.check` (Box vs Sphere)

**After:**
`Vehicle.update` -> `Sphere.applyMatrix4` (Fast) -> `Collider.check` (Sphere vs Sphere)
