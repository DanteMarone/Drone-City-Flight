# Light System Performance

## System Overview
The `LightSystem` manages a pool of real `THREE.PointLight` objects (limited to 12) to simulate hundreds of "virtual" light sources in the world (street lamps, windows, landing pads).

## The Bottleneck
Previously, the `update()` method performed the following operations every frame for every virtual light (potentially hundreds):
1.  **Forced Matrix Update**: Called `vl.parentMesh.updateMatrixWorld()` for every light attached to a mesh. This forces a recalculation of the world matrix from position/quaternion/scale, even if the object hadn't moved or had already been updated by the scene graph.
2.  **Full Sort**: Calculated the squared distance to the camera for every light and sorted the entire array every frame (16ms).

## The Solution
1.  **Removed Redundant Matrix Updates**: We now rely on the scene graph to update matrices. Since `LightSystem.update` runs during the main update loop, we read `matrixWorld` directly. This eliminates hundreds of unnecessary matrix decompositions and compositions per frame.
2.  **Throttled Sorting**: The list of virtual lights is now sorted only every 5 frames. The camera rarely moves fast enough to change the "closest 12 lights" significantly within 80ms.
3.  **Active Light Updates**: For the 12 active lights, we still update their positions every frame (reading from the matrix) to ensure they don't lag behind moving objects (like vehicles).

## Impact
-   **Complexity**:
    -   Sort: O(N log N) -> amortized to 1/5th cost.
    -   Matrix Update: Removed O(N) matrix calcs entirely.
-   **Visuals**: No perceptible lag in light assignment. Moving lights (vehicles) remain smooth because active lights are still updated per-frame.
