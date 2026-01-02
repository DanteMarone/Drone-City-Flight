# Infrastructure System

The infrastructure system provides the foundational static network of the world, including Roads, Rivers, and Sidewalks. These entities serve as both visual environments and navigation surfaces for gameplay logic.

## 1. Entities

### RoadEntity
*   **Type:** `road`
*   **Source:** `src/world/entities/infrastructure.js`
*   **Description:** A dynamically scalable plane representing a paved road with procedural markings.
*   **Geometry:** `THREE.PlaneGeometry`. The mesh is rotated -90° on X to lie flat.
*   **Visuals:**
    *   Uses `TextureGenerator.createAsphalt()` (internally `asphalt_v2`).
    *   Generates a dark grey surface with a centered yellow dashed line.
    *   Texture repeat is synchronized with the mesh length in `update(dt)` to ensure dashed lines maintain a consistent aspect ratio regardless of the road's Z-scale.
*   **Physics:**
    *   Uses standard `BaseEntity` collision (Mesh AABB).
    *   Snaps to the grid to ensure alignment with other infrastructure.

### RiverEntity
*   **Type:** `river`
*   **Source:** `src/world/entities/infrastructure.js`
*   **Description:** A large static water body utilizing standard materials.
*   **Geometry:** `THREE.PlaneGeometry` (default 50x50).
*   **Physics:** `createCollider()` returns `null` to prevent physical collision, allowing the drone to fly over/through it without impact (unlike solid walls).

### SidewalkEntity
*   **Type:** `sidewalk`
*   **Source:** `src/world/entities/infrastructure.js`
*   **Description:** A raised concrete pathway (0.2 units high) with procedural pavement grooves.
*   **Geometry:** `THREE.BoxGeometry` (1x0.2x5).
*   **Visuals:**
    *   Uses a multi-material setup:
        *   **Top:** `TextureGenerator.createSidewalk()` with horizontal grooves aligned to integer grid units.
        *   **Sides/Bottom:** `TextureGenerator.createConcrete()`.
    *   Grooves are offset by half a segment to align visually when the 5-unit long object is centered on the grid.

---

## 2. Smart Infrastructure Tools (Road & River)

The "Anchor & Stretch" placement logic is available for both Roads and Rivers, allowing users to draw segments of variable length that automatically snap to the grid and lock to cardinal axes.

### Logic Flow (`src/dev/interaction.js`)

```mermaid
graph TD
    A[MouseDown] -->|Shift/Tool Active| B{Hit Ground?}
    B -->|Yes| C[Set Anchor Point]
    C --> D[Create Ghost Mesh]
    D --> E[MouseMove]
    E --> F{Dragging?}
    F -->|Yes| G[Calculate Delta]
    G --> H[Lock Axis (North/South or East/West)]
    H --> I[Snap Length to 10m Increments]
    I --> J[Update Ghost Transform]
    J --> K[MouseUp]
    K --> L[Finalize Placement]
    L --> M[Instantiate RoadEntity]
```

### Key Behaviors

1.  **Anchor Point:** The initial `mousedown` location on the ground plane becomes the fixed start point (`placementAnchor`).
2.  **Axis Locking:** The tool compares the X and Z components of the drag vector (`diff`). It zeroes out the smaller component, forcing the road to extend strictly North-South or East-West.
3.  **Grid Snapping:**
    *   The drag vector is rounded to the nearest 10 units.
    *   Minimum length is clamped to 10 units.
    *   Ghost rotation is set to 0 (North/South) or 90° (East/West) based on the dominant axis.
4.  **Visual Feedback:** A semi-transparent ghost mesh (`placementGhost`) updates in real-time to show the prospective road's length and orientation.

## 3. Procedural Textures (`src/utils/textures.js`)

The system relies on `CanvasTexture` generation to avoid external asset dependencies and allow runtime customization.

*   **Asphalt V2:**
    *   Resolution: 256x256
    *   Base: Dark Grey (`#1a1a1a`) with noise grain.
    *   Marking: Single yellow dashed segment (4px width) centered vertically.
    *   Logic: The `RoadEntity` sets `texture.repeat.y` to `length / 10`, effectively tiling this single segment to create a continuous dashed line.

*   **Sidewalk:**
    *   Resolution: 128x640 (1:5 Aspect Ratio)
    *   Base: Concrete Grey (`#bbbbbb`) with noise.
    *   Grooves: 5 horizontal lines drawn at exact intervals.
    *   Logic: The texture aspect ratio matches the entity geometry (1x5), ensuring 1:1 pixel mapping on the top surface.
