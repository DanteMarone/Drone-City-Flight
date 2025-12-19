# Infrastructure System

## Overview
The Infrastructure System encompasses the fundamental static elements that define the city's layout, specifically **Roads**, **Rivers**, and **Sidewalks**. Unlike standard props (which are placed as point objects), infrastructure entities are typically variable in length and require specialized placement tools to ensure alignment and visual consistency.

## Smart Road Tool
The **Smart Road Tool** utilizes a custom "Anchor & Stretch" interaction model designed to facilitate rapid, precise city block construction.

### Interaction Logic
Implemented in `src/dev/interaction.js`, the tool deviates from the standard Drag-and-Drop workflow:

1.  **Anchor (MouseDown)**: The user clicks on the grid to establish the starting point (Anchor).
2.  **Stretch (MouseMove)**: As the mouse moves, the tool calculates a vector from the Anchor to the current cursor position.
    *   **Axis Locking**: The tool strictly enforces alignment to the X or Z axis (Cardinal Directions). It determines the dominant axis based on the mouse delta and zeros out the minor axis.
    *   **Integer Snapping**: The length of the road is rounded to the nearest integer unit. This is critical for preventing visual artifacts in the texture repeating logic.
    *   **Constraint**: A minimum length of 1.0 unit is enforced.
3.  **Place (MouseUp)**: A `RoadEntity` is instantiated with the calculated `position` (midpoint), `rotation` (0 or 90 degrees), and `scale.z` (length).

### Visual Feedback
During the "Stretch" phase, a ghost mesh is rendered using a green, semi-transparent material (`opacity: 0.5`). Its transform is updated in real-time to reflect the snapped length and rotation, providing an accurate preview of the final object.

## Entity Implementations

### RoadEntity
Defined in `src/world/entities/infrastructure.js`.

*   **Geometry**: Uses a `PlaneGeometry` (default 10x10, effectively scaled to `10 x Length`).
*   **Texture Mapping**: The entity uses the `asphalt_v2` procedural texture, which features a dark asphalt base with a centered yellow dashed line.
*   **Dynamic Scaling**: To prevent texture stretching, the entity implements a custom `updateTexture(mesh)` method called during `update(dt)`.
    *   It calculates the `totalLength` in world units.
    *   It updates `mesh.material.map.repeat.y` to match `totalLength / 10`.
    *   This ensures the dash pattern repeats consistently (approx. one dash per 10 meters) regardless of the road's length.

### SidewalkEntity
Defined in `src/world/entities/infrastructure.js`.

*   **Geometry**: A composite `BoxGeometry` (1x0.2x5).
*   **Materials**: Uses a multi-material approach:
    *   **Top**: `sidewalk` procedural texture (concrete tiles).
    *   **Sides/Bottom**: `concrete` procedural texture (plain grey).
*   **Placement**: Designed to be placed alongside roads. (Note: Currently lacks a "Smart Stretch" tool and is placed as fixed segments).

### RiverEntity
Defined in `src/world/entities/infrastructure.js`.

*   **Geometry**: A `PlaneGeometry` representing water.
*   **Material**: Standard material with Blue color (`0x2244aa`), low roughness, and high metalness to simulate water reflection.
*   **Collision**: Explicitly returns `null` for `createCollider()`, as it is a flat surface flush with the ground (or slightly above) and does not impede movement physics in the current iteration.

## Verification
The strict snapping logic of the Road Tool is verified by the script `verify_road_snap_strict.py`, which simulates mouse input and asserts that the resulting ghost mesh scale is always an integer.
