# Spec 005: Organic Road Support

**Feature:** Bezier/Spline-based Roads
**Status:** Draft
**Owner:** Planner

## 1. Overview
Currently, `RoadEntity` and `RiverEntity` are limited to straight segments defined by a single position, rotation, and length. To enable more natural city layouts, we need to support organic curves. This feature introduces `CurveRoadEntity` (and potentially updates `RiverEntity`) to use spline-based geometry.

## 2. User Interaction (Dev Mode)
The "Smart Road Tool" will need an upgrade or a new mode:
*   **Mode A (Straight):** (Current) Click Anchor -> Drag Length -> Release.
*   **Mode B (Curve):**
    1.  **Click (Start):** Sets the starting anchor point (Point A).
    2.  **Drag (Tangent A):** Defines the outgoing tangent vector for Point A.
    3.  **Release:** Confirms Point A and its tangent.
    4.  **Move Mouse:** Previews the curve to the cursor location.
    5.  **Click (End):** Sets the ending anchor point (Point B).
    6.  **Drag (Tangent B):** Defines the incoming tangent for Point B.
    7.  **Release:** Finalizes the segment.

*Alternatively (Simpler MVP):*
*   **3-Point Arc:** Click Start -> Click Midpoint -> Click End.
*   **Spline Path:** Click multiple points to form a `CatmullRomCurve3`. Double-click to finish.

**Decision:** We will use **Cubic Bezier Curves** (Start, Control 1, Control 2, End) as they offer the best control for road curvature and are standard in vector tools.
*   **Interaction:**
    1. Click and drag to place Start Point + Start Handle.
    2. Move mouse to preview.
    3. Click and drag to place End Point + End Handle.

## 3. Data Model
`CurveRoadEntity` will extend `BaseEntity`.
*   `params.p0`: Start Point (Local or World?) -> Local to the entity anchor?
    *   *Approach:* The Entity Anchor is `p0`.
    *   `params.p1`: Control Point 1 (Relative to p0)
    *   `params.p2`: Control Point 2 (Relative to p3)
    *   `params.p3`: End Point (Relative to p0)
*   `userData.curveType`: 'cubic-bezier'

## 4. Visualization
*   **Mesh Generation:**
    *   Use `THREE.TubeGeometry` or a custom `ExtrudeGeometry` along the curve.
    *   **Challenge:** UV Mapping for the asphalt texture. Standard Tube/Extrude often stretches UVs.
    *   **Solution:** We need "Arc Length Parameterization" to ensure the dashed lines repeat uniformly regardless of curve length.
    *   The `RoadEntity` already handles UV scaling for straight segments. For curves, we map `v` coordinate to accumulated length.

## 5. Physics / Collision
*   **Collision Mesh:**
    *   A curved tube is concave. Most physics engines (and our simple `ColliderSystem`) prefer Convex shapes.
    *   **Approach:** Segment the curve into N linear segments (e.g., every 5 meters or 10 degrees).
    *   Create a generic OBB (Oriented Bounding Box) for each segment.
    *   `ColliderSystem` might need to support "Composite Colliders" (which it does via children).
    *   So `CurveRoadEntity` will generate multiple invisible `BoxGeometry` children for physics.

## 6. Implementation Plan
1.  **Prototype `CurveRoadEntity`:**
    *   Hardcoded Bezier curve.
    *   Generate visual mesh with `TubeGeometry` + Asphalt Texture.
    *   Verify UV repeat logic.
2.  **Physics Integration:**
    *   Generate child collider boxes along the curve.
    *   Verify `VehicleEntity` can drive on it (this is the hard part - pathfinding).
3.  **Interaction Tool:**
    *   Update `src/dev/interaction.js` to support the "Click-Drag-Move-Click-Drag" workflow.

## 7. Open Questions
*   **Vehicle AI:** Existing vehicles follow `waypoints` (linear points).
    *   *Solution:* The `CurveRoadEntity` should be able to "sample" itself to generate a dense list of linear waypoints for the vehicle graph.
