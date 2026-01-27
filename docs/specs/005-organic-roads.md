# Specification: Organic Curve Support

## 1. Overview
The current road system relies on straight grid-based segments. To enable more organic and realistic city layouts, we need to introduce curved roads. This specification outlines the implementation of Bezier/Spline-based roads.

## 2. Requirements
*   **Curved Geometry:** Support for smooth curves (not just sharp angles).
*   **Chaining:** Ability to chain multiple segments for complex paths.
*   **Texturing:** Asphalt texture must follow the curve direction (UV mapping along the path).
*   **Interaction:** A user-friendly tool to place control points.

## 3. Technical Implementation

### 3.1. Entity: `CurveRoadEntity`
A new entity extending `BaseEntity`.

*   **Properties:**
    *   `controlPoints`: Array of `THREE.Vector3` (local space, or world space if convenient).
    *   `width`: Road width (standard 10 units).
    *   `resolution`: Number of segments for the curve geometry.

*   **Geometry:**
    *   Use `THREE.CatmullRomCurve3` for smooth paths through points.
    *   Alternatively, `THREE.CubicBezierCurve3` for precise 4-point control.
    *   **Mesh Generation:** Use `THREE.TubeGeometry` (circular cross-section, flattened) or `ExtrudeGeometry` with a custom shape (flat road profile). A custom shape extruded along the curve is preferred for flat roads.

*   **Texturing:**
    *   The geometry generation must ensure UVs map `u` across the width and `v` along the length.
    *   `texture.repeat.y` should be calculated based on the curve's total length to maintain consistent asphalt scale.

### 3.2. Interaction: Spline Tool
A new tool in `InteractionManager` (or mode in `PlacementManager`).

*   **Input State Machine:**
    1.  **Start:** User clicks to place the first point (Anchor).
    2.  **Edit:** User moves mouse to preview the curve end/control point.
    3.  **Add Point:** User clicks to add a control point. The curve extends.
    4.  **Finish:** User double-clicks or presses Enter to finalize the road.

*   **Visual Feedback:**
    *   Render a line or "ghost" mesh showing the proposed curve during placement.
    *   Show control point handles (spheres) that can be dragged after placement (Future scope: Edit Mode).

### 3.3. Data Serialization
*   Save the list of `controlPoints` in the level data.

## 4. Risks & Considerations
*   **Texture Distortion:** Sharp turns might distort the texture. `frenetFrames` in extrusion might need tweaking to prevent twisting.
*   **Physics:** Mesh collision for curves needs to be accurate. `MeshCollider` is expensive; might need a simplified approximate collider or a series of box colliders.
*   **Intersection:** Connecting curves to grid roads is complex. V1 will likely just overlap; proper intersections are V2.

## 5. Plan
1.  Prototype `CurveRoadEntity` with hardcoded points.
2.  Implement `ExtrudeGeometry` logic for the road profile.
3.  Implement `SplineTool` for interaction.
4.  Refine texturing and UVs.
