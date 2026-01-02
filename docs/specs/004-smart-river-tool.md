# Spec: Smart River Tool

**Goal:** Enable "Anchor & Stretch" creation for Rivers, allowing rapid placement of water bodies with variable length.

## User Story
As a Level Designer, I want to create rivers by clicking to set a start point and dragging to define the length, so I can quickly build waterways that align with the grid and scale to my needs.

## Acceptance Criteria
*   [ ] **Interaction Mode:** Selecting "River" from the palette activates the "Smart Placement" mode (same as Road).
*   [ ] **Anchor:** Clicking on the ground sets the start point (Anchor).
*   [ ] **Stretch:** Moving the mouse after anchoring stretches the preview mesh along the dominant axis (X or Z).
*   [ ] **Constraints:**
    *   **Axis Lock:** The river snaps to the nearest cardinal axis (North/South or East/West).
    *   **Grid Snap:** The length snaps to integer units if Grid Snap is enabled.
    *   **Fixed Width:** The width remains constant (default 50 units or as defined in `RiverEntity`), only the length scales.
*   [ ] **Visual Feedback:** The ghost preview updates in real-time to show the stretched dimension.
*   [ ] **Creation:** Releasing the mouse button creates the `RiverEntity` with the correct position, rotation, and scale (length).
*   [ ] **Material Handling:** Ensure the river material looks correct when stretched (no extreme stretching artifacts if using textures in the future, currently color-only).

## Implementation Details

### `src/dev/interaction.js`
*   Modify `_handlePlacementMouseMove` and `_updatePlacementGhost` to handle `type === 'river'`.
*   The logic should share the "Anchor & Stretch" behavior of `road`.
*   Ensure the width scaling logic is separate: `road` is narrow (10), `river` is wide (50). The code currently might hardcode assumptions or params.
    *   `_updatePlacementGhost` needs to know the base width of the entity to center it correctly, or rely on the ghost mesh's initial scale.

### `src/world/entities/infrastructure.js`
*   Verify `RiverEntity` constructor accepts `width` and `length`.
*   Ensure the mesh generation uses these parameters.
*   (Optional) If a water texture is added later, implement `updateTexture` similar to `RoadEntity`. For now, standard material is fine.

## Open Questions
*   Should rivers auto-connect like roads (intersections)? *Scope for future "Organic Curve Support" or "River Junctions". For now, simple overlapping planes are sufficient.*
