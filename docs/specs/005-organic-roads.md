# Specification: Organic Curve Roads

## 1. Overview
This feature introduces `CurveRoadEntity`, allowing users to place curved roads using a quadratic Bezier curve. This breaks the rigid grid structure and allows for more organic city layouts.

## 2. User Interaction
The placement tool will use a **3-step interaction**:
1.  **Anchor (Click 1):** Sets the **Start Point** (P0).
2.  **Stretch (Mouse Move):** Previews a straight line to the cursor.
3.  **Endpoint (Click 2):** Sets the **End Point** (P2). The tool enters "Curve Mode".
4.  **Curve (Mouse Move):** The cursor controls the **Control Point** (P1). The road bends towards the cursor.
5.  **Finalize (Click 3):** Commits the road to the world.

*Note:* Standard `Esc` key cancels the placement at any stage.

## 3. Entity Architecture
### `CurveRoadEntity`
*   **Inherits:** `BaseEntity` (or `RoadEntity` if refactored).
*   **Data:**
    *   `start`: Vector3
    *   `end`: Vector3
    *   `control`: Vector3 (The quadratic Bezier control point)
    *   `segments`: Integer (Resolution of the curve, e.g., 16 or 32)
    *   `width`: Float (Road width, matching `RoadEntity`)

### Mesh Generation
*   Use `THREE.Shape` and `THREE.ExtrudeGeometry`? Or custom `BufferGeometry`?
*   **Decision:** Custom `BufferGeometry` or `Ribbon` generation is best for UV mapping. We need the texture to flow *along* the curve.
*   **Algorithm:**
    *   Sample points along the Bezier curve $B(t) = (1-t)^2 P_0 + 2(1-t)t P_1 + t^2 P_2$.
    *   Compute the tangent and normal at each sample.
    *   Extrude vertices left and right of the center line.
    *   Generate UVs where `u` repeats along the length and `v` spans the width (0 to 1).

## 4. Systems Impact
### `InteractionManager`
*   Needs to support a multi-stage state machine: `IDLE` -> `PLACING_ENDPOINT` -> `PLACING_CONTROL`.
*   Current "Anchor & Stretch" logic needs to be extensible.

### `TextureGenerator`
*   Can reuse the existing `asphalt_v2` texture.
*   The geometry generation must ensure the texture doesn't stretch weirdly. We calculate the curve length to determine how many times the texture repeats.

## 5. Technical Constraints
*   **Physics:** A simple BoxCollider won't work. We might need:
    *   A MeshCollider (expensive).
    *   A series of small BoxColliders along the curve (approximated).
    *   For v1, a simplified BoxCollider covering the chord might suffice, or just no collisions for the curve segments if complex. **Decision:** Series of small BoxColliders for v1 to ensure vehicles don't fall through.

## 6. Future Scope (Not in v1)
*   Cubic Bezier (2 control points).
*   Banking/Elevation.
*   Snapping to other curve endpoints.
