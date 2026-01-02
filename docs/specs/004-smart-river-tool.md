# Spec: Smart River Tool

## Status: Completed

## Goal
Adapt the "Anchor & Stretch" interaction model, currently used for Roads, to work for Rivers. This will allow users to place rivers of variable length that snap to the grid and lock to cardinal axes.

## Requirements

### Interaction
1.  **Anchor Point:** Clicking with the River tool sets the start point.
2.  **Drag-to-Stretch:** Moving the mouse stretches the river length.
3.  **Axis Locking:** Rivers must lock to North-South or East-West alignment based on the dominant drag direction.
4.  **Grid Snapping:** Length should snap to integer grid units (e.g., 10m increments or 1m, consistent with roads).
5.  **Ghost Preview:** A visual ghost must show the potential river before placement.

### Entity Support
1.  **RiverEntity:** Must accept a `length` parameter (and potentially `width`) and construct the mesh accordingly.
2.  **Scaling:** The interaction should modify the `scale.z` of the entity or instantiate it with the correct geometry.

### Acceptance Criteria
- [ ] Selecting "River" from the toolbar/palette enters placement mode.
- [ ] Clicking on the ground starts the anchor.
- [ ] Dragging constrains the ghost to N/S or E/W axes.
- [ ] Dragging snaps the length to the grid.
- [ ] Releasing the mouse creates a `RiverEntity` with the specified length and rotation.
- [ ] The generated River behaves like a standard static object (no collision, but visual presence).

## Technical Implementation
-   Modify `src/dev/interaction.js`:
    -   Update `_handlePlacementMouseMove` and `_handlePlacementMouseUp` to treat `river` similarly to `road`.
    -   Ensure the default `width` for rivers (50) is preserved or configurable.
-   Modify `src/world/entities/infrastructure.js`:
    -   Ensure `RiverEntity` supports dynamic sizing via constructor params or scaling.
